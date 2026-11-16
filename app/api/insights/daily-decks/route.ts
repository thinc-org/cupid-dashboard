import type { NextRequest } from "next/server";
import {
  dailyDeckQuery,
  readDailyDeckInsights,
} from "@/lib/insights/daily-decks";
import { proxyInsightsRequest } from "@/lib/server/insights-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyInsightsRequest({
    request,
    upstreamPath: "/insights/daily-decks",
    logPrefix: "daily-deck-insights",
    subjectLabel: "Deck insights",
    parseQuery: dailyDeckQuery,
    parseResponse: readDailyDeckInsights,
  });
}
