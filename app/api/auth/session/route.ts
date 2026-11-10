import type { NextRequest } from "next/server";
import { authResponse, setSessionCookie } from "@/lib/server/auth-response";
import {
  getStaffConfig,
  STAFF_SESSION_COOKIE,
  StaffAccessDenied,
  verifyStaffSession,
} from "@/lib/server/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return authResponse({ message: "Please sign in." }, 401);

  let config;
  try {
    config = getStaffConfig();
  } catch {
    return authResponse({ message: "Staff sign-in is not configured." }, 503);
  }
  try {
    const identity = await verifyStaffSession(token, config);
    return authResponse({ email: identity.email });
  } catch (error) {
    const denied = error instanceof StaffAccessDenied;
    return setSessionCookie(
      authResponse(
        {
          message: denied
            ? "This Google account is not allowed to use the dashboard."
            : "Your session is no longer valid. Please sign in again.",
        },
        denied ? 403 : 401,
      ),
      "",
    );
  }
}
