import type { NextRequest } from "next/server";
import {
  audienceInsightsQuery,
  readAudienceInsights,
} from "@/lib/insights/audience";
import { buildDevMockAudienceInsights } from "@/lib/insights/mock-audience";
import { proxyInsightsRequest } from "@/lib/server/insights-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyInsightsRequest({
    request,
    upstreamPath: "/insights/users",
    logPrefix: "audience-insights",
    subjectLabel: "Audience insights",
    parseQuery: audienceInsightsQuery,
    parseResponse: readAudienceInsights,
    mockHandler: (req, query) => {
      if (process.env.NODE_ENV === "production") return null;
      const wantsMock =
        req.nextUrl.searchParams.get("mock") === "1" ||
        process.env.CUPID_MOCK_INSIGHTS === "1";
      if (!wantsMock) return null;
      return buildDevMockAudienceInsights(query);
    },
  });
}
