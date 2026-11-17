"use client";

import { readEngagementInsights } from "@/lib/insights/engagement";
import {
  buildInsightsQueryString,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { useInsightsQuery } from "@/lib/insights/use-insights-query";
import { EngagementChartsSection } from "./engagement/engagement-charts-section";
import { EngagementKpiSection } from "./engagement/engagement-kpi-section";
import { computeEngagementSummary } from "./engagement/engagement-summary";

type EngagementPanelProps = {
  filters: InsightsFilters;
  useDevMock?: boolean;
  onLoadingChange?: (loading: boolean) => void;
};

export function EngagementPanel({
  filters,
  useDevMock = false,
  onLoadingChange,
}: EngagementPanelProps) {
  const mockParam =
    useDevMock && process.env.NODE_ENV !== "production" ? "&mock=1" : "";
  const url = `/api/insights/engagement?${buildInsightsQueryString(filters)}${mockParam}`;

  const {
    data: insights,
    error,
    loading,
  } = useInsightsQuery(
    url,
    readEngagementInsights,
    { subject: "Engagement insights" },
    onLoadingChange,
  );

  if (error) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-card p-5 text-sm text-destructive"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (loading || !insights) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {[1, 2, 3, 4].map((slot) => (
          <div
            key={slot}
            className="h-28 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  const summary = computeEngagementSummary(insights);

  return (
    <div className="space-y-6">
      <EngagementKpiSection insights={insights} summary={summary} />
      <EngagementChartsSection insights={insights} summary={summary} />
    </div>
  );
}
