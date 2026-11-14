"use client";

import { useEffect, useState } from "react";
import {
  readDailyDeckInsights,
  type DailyDeckDay,
} from "@/lib/insights/daily-decks";
import {
  buildInsightsQueryString,
  defaultInsightsFilters,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { useInsightsQuery } from "@/lib/insights/use-insights-query";
import { ChartCard } from "./insights/chart-card";
import {
  VerticalBarChart,
  type BarChartCategory,
} from "./insights/charts/bar-chart";
import { formatCount, formatDecimal } from "./insights/formatters";

type DailyDeckInsightsPanelProps = {
  filters?: InsightsFilters;
  onLoadingChange?: (loading: boolean) => void;
};

export function DailyDeckInsightsPanel({
  filters: externalFilters,
  onLoadingChange,
}: DailyDeckInsightsPanelProps) {
  const [fallbackFilters, setFallbackFilters] =
    useState<InsightsFilters | null>(null);

  useEffect(() => {
    if (!externalFilters) {
      setFallbackFilters(defaultInsightsFilters());
    }
  }, [externalFilters]);

  const activeFilters = externalFilters ?? fallbackFilters;
  const requestUrl = activeFilters
    ? `/api/insights/daily-decks?${buildInsightsQueryString(activeFilters)}`
    : null;

  const {
    data: insights,
    error,
    loading,
  } = useInsightsQuery(
    requestUrl,
    readDailyDeckInsights,
    { subject: "Deck insights" },
    onLoadingChange,
  );

  if (!activeFilters || loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
        {[1, 2].map((slot) => (
          <div
            key={slot}
            className="h-52 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

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

  if (!insights) return null;

  const dates = insights.days.map((day) => day.date);
  const categories = dates.map((date) => ({
    key: date,
    label: date,
    shortLabel: date.slice(5),
  }));
  const byDate = new Map(insights.days.map((day) => [day.date, day]));

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Metrics reflect deck recipients per day.
      </p>

      <DailyDeckChartsGrid
        categories={categories}
        byDate={byDate}
        empty={dates.length === 0}
      />

      {insights.days.length > 0 ? (
        <DailyDeckBreakdownTable days={insights.days} />
      ) : null}
    </div>
  );
}

function DailyDeckChartsGrid({
  categories,
  byDate,
  empty,
}: {
  categories: BarChartCategory[];
  byDate: Map<string, DailyDeckDay>;
  empty: boolean;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <ChartCard title="Decks generated" empty={empty}>
        <VerticalBarChart
          title="Decks generated"
          highlightPeak
          categories={categories}
          series={[
            {
              label: "Decks generated",
              colorClass: "bg-[#fb7185]",
              getColorClass: (_key, isPeak) =>
                isPeak ? "bg-[#f43f5e]" : "bg-[#fb7185]",
              getValue: (date) => byDate.get(date)?.decksGenerated ?? 0,
            },
          ]}
        />
      </ChartCard>

      <ChartCard title="Total candidate slots" empty={empty}>
        <VerticalBarChart
          title="Total candidate slots"
          highlightPeak
          categories={categories}
          series={[
            {
              label: "Candidate slots",
              colorClass: "bg-[#f472b6]",
              getColorClass: (_key, isPeak) =>
                isPeak ? "bg-[#db2777]" : "bg-[#f472b6]",
              getValue: (date) => byDate.get(date)?.totalCandidateSlots ?? 0,
            },
          ]}
        />
      </ChartCard>

      <ChartCard title="Average deck size" empty={empty}>
        <VerticalBarChart
          title="Average deck size"
          categories={categories}
          series={[
            {
              label: "Average size",
              colorClass: "bg-[#f9a8d4]",
              getValue: (date) => byDate.get(date)?.averageDeckSize ?? 0,
              formatValue: formatDecimal,
            },
          ]}
        />
      </ChartCard>

      <ChartCard title="Completed decks" empty={empty}>
        <VerticalBarChart
          title="Completed decks"
          highlightPeak
          categories={categories}
          series={[
            {
              label: "Completed decks",
              colorClass: "bg-[#fb7185]",
              getColorClass: (_key, isPeak) =>
                isPeak ? "bg-[#f43f5e]" : "bg-[#fb7185]",
              getValue: (date) => byDate.get(date)?.completedDecks ?? 0,
            },
          ]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-2"
        title="Completion rate"
        description="Share of generated decks fully reviewed each day."
        empty={empty}
      >
        <VerticalBarChart
          title="Completion rate"
          categories={categories}
          maxValue={100}
          series={[
            {
              label: "Completion rate",
              colorClass: "bg-[#f472b6]",
              getValue: (date) =>
                (byDate.get(date)?.completionRate ?? 0) * 100,
              formatValue: (value) => `${formatDecimal(value)}%`,
            },
          ]}
        />
      </ChartCard>
    </div>
  );
}

function DailyDeckBreakdownTable({ days }: { days: DailyDeckDay[] }) {
  return (
    <ChartCard title="Daily deck breakdown">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Daily deck counts</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Decks</th>
              <th className="py-2 pr-3 font-medium">Slots</th>
              <th className="py-2 pr-3 font-medium">Average size</th>
              <th className="py-2 pr-3 font-medium">Completed</th>
              <th className="py-2 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 tabular-nums">
            {days.map((day) => (
              <tr key={day.date}>
                <td className="py-2 pr-3 font-medium">{day.date}</td>
                <td className="py-2 pr-3">
                  {formatCount(day.decksGenerated)}
                </td>
                <td className="py-2 pr-3">
                  {formatCount(day.totalCandidateSlots)}
                </td>
                <td className="py-2 pr-3">
                  {formatDecimal(day.averageDeckSize)}
                </td>
                <td className="py-2 pr-3">
                  {formatCount(day.completedDecks)}
                </td>
                <td className="py-2">
                  {formatDecimal(day.completionRate * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
