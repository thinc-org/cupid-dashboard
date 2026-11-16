import "server-only";
import type { NextResponse } from "next/server";
import { authResponse, setSessionCookie } from "@/lib/server/auth-response";
import { configurationError } from "@/lib/server/insights-request";
import { verifyStaffSession, type StaffConfig } from "@/lib/server/staff-auth";

export async function fetchUpstream(
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

export async function handleUpstreamResponse({
  upstream,
  signal,
  query,
  token,
  config,
  logPrefix,
  subjectLabel,
  parseResponse,
}: {
  upstream: Response;
  signal: AbortSignal;
  query: string;
  token: string;
  config: StaffConfig;
  logPrefix: string;
  subjectLabel: string;
  parseResponse: (body: unknown, query?: string) => object | null;
}): Promise<NextResponse> {
  if (upstream.status === 401 || upstream.status === 403) {
    return mapUpstreamAuthFailure(upstream.status, token, config);
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await upstream.json()) as Record<string, unknown>;
  } catch {
    if (signal.aborted) {
      return authResponse(
        { message: `${subjectLabel} timed out. Please try again.` },
        504,
      );
    }
  }

  if (!upstream.ok) {
    return mapUpstreamErrorStatus(
      upstream.status,
      body,
      logPrefix,
      subjectLabel,
    );
  }

  const insights = parseResponse(body, query);
  if (!insights) {
    return authResponse(
      { message: `${subjectLabel} returned an unexpected response.` },
      502,
    );
  }
  return authResponse(insights);
}

async function mapUpstreamAuthFailure(
  status: number,
  token: string,
  config: StaffConfig,
): Promise<NextResponse> {
  if (status === 403) {
    return authResponse(
      { message: "Your account does not have access to CUpid insights." },
      403,
    );
  }

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

function mapUpstreamErrorStatus(
  status: number,
  body: Record<string, unknown> | null,
  logPrefix: string,
  subjectLabel: string,
): NextResponse {
  if (status === 503) {
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

  if (status === 400 && typeof body?.message === "string") {
    return authResponse({ message: body.message }, 400);
  }

  return authResponse({ message: `${subjectLabel} could not be loaded.` }, 502);
}
