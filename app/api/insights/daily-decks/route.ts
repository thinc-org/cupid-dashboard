import { NextRequest } from "next/server";
import {
  dailyDeckQuery,
  readDailyDeckInsights,
} from "@/lib/insights/daily-decks";
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
    await verifyStaffSession(token, config);
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

  const parsed = dailyDeckQuery(request.nextUrl.searchParams);
  if (!parsed.ok) return authResponse({ message: parsed.message }, 400);

  const apiUrl = process.env.CUPID_API_URL?.trim() ?? "";
  if (!apiUrl)
    return configurationError("Set CUPID_API_URL on the dashboard server.");

  let url: URL;
  try {
    url = new URL(apiUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error("Invalid API URL");
    }
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/insights/daily-decks`;
    url.search = parsed.query;
  } catch {
    return configurationError(
      "CUPID_API_URL must be an HTTP(S) backend base URL without credentials, query, or fragment.",
    );
  }

  let upstream: Response;
  const signal = AbortSignal.timeout(15_000);
  try {
    upstream = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
      signal,
    });
  } catch (error) {
    if (
      signal.aborted ||
      (error instanceof Error && error.name === "TimeoutError")
    ) {
      return authResponse(
        { message: "Deck insights timed out. Please try again." },
        504,
      );
    }
    return authResponse(
      { message: "Deck insights could not be reached." },
      502,
    );
  }

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
    if (signal.aborted)
      return authResponse(
        { message: "Deck insights timed out. Please try again." },
        504,
      );
    body = null;
  }
  if (upstream.status === 503) {
    if (body?.message === "staff insights are not configured") {
      return configurationError(
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
    return authResponse({ message: "Deck insights could not be loaded." }, 502);
  }

  const insights = readDailyDeckInsights(body);
  if (!insights) {
    return authResponse(
      { message: "Deck insights returned an unexpected response." },
      502,
    );
  }
  return authResponse(insights);
}

function configurationError(detail: string) {
  console.error(`[daily-deck-insights] ${detail}`);
  return authResponse(
    {
      message:
        process.env.NODE_ENV === "production"
          ? "Deck insights are not configured. Contact the dashboard administrator."
          : detail,
      code: "INSIGHTS_NOT_CONFIGURED",
    },
    503,
  );
}
