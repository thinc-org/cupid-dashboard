import type { NextRequest } from "next/server";
import {
  authenticateStaffRequest,
  authResponse,
} from "@/lib/server/auth-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) return auth.response;
  return authResponse({ email: auth.identity.email });
}
