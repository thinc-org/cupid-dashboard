import {
  authResponse,
  sameOrigin,
  setSessionCookie,
} from "@/lib/server/auth-response";
import {
  createStaffSession,
  getStaffConfig,
  StaffAccessDenied,
  verifyGoogleCredential,
} from "@/lib/server/staff-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return authResponse({ message: "Invalid request origin." }, 403);

  const body = await request.json().catch(() => null);
  if (
    typeof body?.credential !== "string" ||
    !body.credential ||
    body.credential.length > 16_384
  ) {
    return authResponse({ message: "A Google credential is required." }, 400);
  }

  let config;
  try {
    config = getStaffConfig();
  } catch {
    return authResponse({ message: "Staff sign-in is not configured." }, 503);
  }
  try {
    const identity = await verifyGoogleCredential(body.credential, config);
    const token = await createStaffSession(identity, config);
    return setSessionCookie(authResponse({ email: identity.email }), token);
  } catch (error) {
    return authResponse(
      {
        message:
          error instanceof StaffAccessDenied
            ? "This Google account is not allowed to use the dashboard."
            : "Google sign-in was rejected. Please try again.",
      },
      error instanceof StaffAccessDenied ? 403 : 401,
    );
  }
}
