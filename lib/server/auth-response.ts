import "server-only";

import { NextResponse } from "next/server";
import { STAFF_SESSION_COOKIE, STAFF_SESSION_SECONDS } from "./staff-auth";

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
