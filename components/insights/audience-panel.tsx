"use client";

import { readAudienceInsights } from "@/lib/insights/audience";
import {
  buildInsightsQueryString,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { useInsightsQuery } from "@/lib/insights/use-insights-query";
import { AudienceDemographicsSection } from "./audience/audience-demographics-section";
import { AudienceHealthSection } from "./audience/audience-health-section";
import { AudienceKpiSection } from "./audience/audience-kpi-section";
import { computeAudienceSummary } from "./audience/audience-summary";
import { MatchPreferencesSection } from "./audience/match-preferences-section";

type AudiencePanelProps = {
  filters: InsightsFilters;
  useDevMock?: boolean;
  onLoadingChange?: (loading: boolean) => void;
};

export function AudiencePanel({
  filters,
  useDevMock = false,
  onLoadingChange,
}: AudiencePanelProps) {
  const mockParam =
    useDevMock && process.env.NODE_ENV !== "production" ? "&mock=1" : "";
  const url = `/api/insights/users?${buildInsightsQueryString(filters)}${mockParam}`;

  const {
    data: insights,
    error,
    loading,
  } = useInsightsQuery(
    url,
    readAudienceInsights,
    { subject: "Audience insights" },
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

  const summary = computeAudienceSummary(insights);

  return (
    <div className="space-y-6">
      <AudienceKpiSection insights={insights} summary={summary} />
      <AudienceHealthSection insights={insights} summary={summary} />
      <AudienceDemographicsSection insights={insights} />
      <MatchPreferencesSection matchFilters={insights.matchFilters} />
    </div>
  );
}
