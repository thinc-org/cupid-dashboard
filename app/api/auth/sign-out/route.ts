import {
  authResponse,
  sameOrigin,
  setSessionCookie,
} from "@/lib/server/auth-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return authResponse({ message: "Invalid request origin." }, 403);
  return setSessionCookie(authResponse({ message: "Signed out." }), "");
}
