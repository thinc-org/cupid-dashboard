import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import {
  getStaffConfig,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_SECONDS,
  StaffAccessDenied,
  verifyStaffSession,
  type StaffConfig,
  type StaffIdentity,
} from "./staff-auth";

export function authResponse(body: object, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: token ? STAFF_SESSION_SECONDS : 0,
  });
  return response;
}

export async function authenticateStaffRequest(
  request: NextRequest,
): Promise<
  | { ok: true; token: string; config: StaffConfig; identity: StaffIdentity }
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
      response: authResponse({ message: "Staff sign-in is not configured." }, 503),
    };
  }

  try {
    const identity = await verifyStaffSession(token, config);
    return { ok: true, token, config, identity };
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
