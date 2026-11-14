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

export async function authenticateInsightsRequest(
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

export function resolveUpstreamUrl(
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

export function configurationError(
  logPrefix: string,
  subjectLabel: string,
  detail: string,
): NextResponse {
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
