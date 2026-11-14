import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { authResponse, setSessionCookie } from "@/lib/server/auth-response";
import {
  getStaffConfig,
  STAFF_SESSION_COOKIE,
  StaffAccessDenied,
  verifyStaffSession,
  type StaffConfig,
} from "@/lib/server/staff-auth";

type QueryParser = (
  params: URLSearchParams,
) => { ok: true; query: string } | { ok: false; message: string };

type ProxyInsightsOptions<T> = {
  request: NextRequest;
  upstreamPath: string;
  logPrefix: string;
  subjectLabel: string;
  parseQuery: QueryParser;
  parseResponse: (body: unknown) => T | null;
  mockHandler?: (request: NextRequest, query: string) => T | null;
};

export async function proxyInsightsRequest<T>({
  request,
  upstreamPath,
  logPrefix,
  subjectLabel,
  parseQuery,
  parseResponse,
  mockHandler,
}: ProxyInsightsOptions<T>) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) return auth.response;

  const parsed = parseQuery(request.nextUrl.searchParams);
  if (!parsed.ok) return authResponse({ message: parsed.message }, 400);

  if (mockHandler) {
    const mockData = mockHandler(request, parsed.query);
    if (mockData !== null) {
      const sanitized = parseResponse(mockData);
      if (!sanitized) {
        return authResponse(
          { message: `${subjectLabel} returned an unexpected response.` },
          502,
        );
      }
      return authResponse(sanitized);
    }
  }

  const target = resolveUpstreamUrl(
    process.env.CUPID_API_URL?.trim() ?? "",
    upstreamPath,
    parsed.query,
    logPrefix,
    subjectLabel,
  );
  if (!target.ok) return target.response;

  const fetched = await fetchUpstream(target.url, auth.token, subjectLabel);
  if (!fetched.ok) return fetched.response;

  return handleUpstreamResponse({
    upstream: fetched.upstream,
    signal: fetched.signal,
    token: auth.token,
    config: auth.config,
    logPrefix,
    subjectLabel,
    parseResponse,
  });
}

async function authenticateStaffRequest(
  request: NextRequest,
): Promise<
  | { ok: true; token: string; config: StaffConfig }
  | { ok: false; response: NextResponse }
> {
  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  if (!token) {
    return {
      ok: false,
      response: authResponse({ message: "Please sign in." }, 401),
    };
  }

  let config: StaffConfig;
  try {
    config = getStaffConfig();
  } catch {
    return {
      ok: false,
      response: authResponse(
        { message: "Staff sign-in is not configured." },
        503,
      ),
    };
  }

  try {
    await verifyStaffSession(token, config);
    return { ok: true, token, config };
  } catch (error) {
    const denied = error instanceof StaffAccessDenied;
    return {
      ok: false,
      response: setSessionCookie(
        authResponse(
          {
            message: denied
              ? "This Google account is not allowed to use the dashboard."
              : "Your session is no longer valid. Please sign in again.",
          },
          denied ? 403 : 401,
        ),
        "",
      ),
    };
  }
}

function resolveUpstreamUrl(
  apiUrl: string,
  upstreamPath: string,
  query: string,
  logPrefix: string,
  subjectLabel: string,
): { ok: true; url: URL } | { ok: false; response: NextResponse } {
  if (!apiUrl) {
    return {
      ok: false,
      response: configurationError(
        logPrefix,
        subjectLabel,
        "Set CUPID_API_URL on the dashboard server.",
      ),
    };
  }

  try {
    const url = new URL(apiUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error("Invalid API URL");
    }
    const normalizedPath = upstreamPath.startsWith("/")
      ? upstreamPath
      : `/${upstreamPath}`;
    url.pathname = `${url.pathname.replace(/\/+$/, "")}${normalizedPath}`;
    url.search = query;
    return { ok: true, url };
  } catch {
    return {
      ok: false,
      response: configurationError(
        logPrefix,
        subjectLabel,
        "CUPID_API_URL must be an HTTP(S) backend base URL without credentials, query, or fragment.",
      ),
    };
  }
}

async function fetchUpstream(
  url: URL,
  token: string,
  subjectLabel: string,
): Promise<
  | { ok: true; upstream: Response; signal: AbortSignal }
  | { ok: false; response: NextResponse }
> {
  const signal = AbortSignal.timeout(15_000);
  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
      signal,
    });
    return { ok: true, upstream, signal };
  } catch (error) {
    if (
      signal.aborted ||
      (error instanceof Error && error.name === "TimeoutError")
    ) {
      return {
        ok: false,
        response: authResponse(
          { message: `${subjectLabel} timed out. Please try again.` },
          504,
        ),
      };
    }
    return {
      ok: false,
      response: authResponse(
        { message: `${subjectLabel} could not be reached.` },
        502,
      ),
    };
  }
}

async function handleUpstreamResponse<T>({
  upstream,
  signal,
  token,
  config,
  logPrefix,
  subjectLabel,
  parseResponse,
}: {
  upstream: Response;
  signal: AbortSignal;
  token: string;
  config: StaffConfig;
  logPrefix: string;
  subjectLabel: string;
  parseResponse: (body: unknown) => T | null;
}) {
  if (upstream.status === 401) {
    // A session verified here can be rejected by a differently configured backend.
    // Recheck expiry before deciding whether the user's dashboard session is invalid.
    try {
      await verifyStaffSession(token, config);
    } catch {
      return setSessionCookie(
        authResponse(
          { message: "Your session is no longer valid. Please sign in again." },
          401,
        ),
        "",
      );
    }
    return authResponse(
      {
        message:
          "The CUpid insights service could not authorize this request. Contact the dashboard administrator.",
      },
      502,
    );
  }
  if (upstream.status === 403) {
    return authResponse(
      { message: "Your account does not have access to CUpid insights." },
      403,
    );
  }

  let body;
  try {
    body = await upstream.json();
  } catch {
    if (signal.aborted) {
      return authResponse(
        { message: `${subjectLabel} timed out. Please try again.` },
        504,
      );
    }
    body = null;
  }
  if (upstream.status === 503) {
    if (body?.message === "staff insights are not configured") {
      return configurationError(
        logPrefix,
        subjectLabel,
        "Configure BACKEND_STAFF_SESSION_SECRET and BACKEND_STAFF_EMAILS on the CUpid backend to match the dashboard.",
      );
    }
    return authResponse(
      {
        message:
          "CUpid insights are temporarily unavailable. Please try again.",
      },
      503,
    );
  }
  if (upstream.status === 400 && typeof body?.message === "string") {
    return authResponse({ message: body.message }, 400);
  }
  if (!upstream.ok) {
    return authResponse(
      { message: `${subjectLabel} could not be loaded.` },
      502,
    );
  }

  const insights = parseResponse(body);
  if (!insights) {
    return authResponse(
      { message: `${subjectLabel} returned an unexpected response.` },
      502,
    );
  }
  return authResponse(insights);
}

function configurationError(
  logPrefix: string,
  subjectLabel: string,
  detail: string,
) {
  console.error(`[${logPrefix}] ${detail}`);
  return authResponse(
    {
      message:
        process.env.NODE_ENV === "production"
          ? `${subjectLabel} are not configured. Contact the dashboard administrator.`
          : detail,
      code: "INSIGHTS_NOT_CONFIGURED",
    },
    503,
  );
}
