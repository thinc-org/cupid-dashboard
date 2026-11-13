"use client";

import { useEffect, useState } from "react";
import {
  readDailyDeckInsights,
  type DailyDeckInsights,
} from "@/lib/insights/daily-decks";
import {
  buildInsightsQueryString,
  defaultInsightsFilters,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { ChartCard } from "./insights/chart-card";
import { VerticalBarChart } from "./insights/charts/bar-chart";
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
  const [insights, setInsights] = useState<DailyDeckInsights | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!externalFilters) {
      setFallbackFilters(defaultInsightsFilters());
    }
  }, [externalFilters]);

  const activeFilters = externalFilters ?? fallbackFilters;

  useEffect(() => {
    if (!activeFilters) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    onLoadingChange?.(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch(
          `/api/insights/daily-decks?${buildInsightsQueryString(activeFilters)}`,
          {
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        const body = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok) {
          setInsights(null);
          setError(
            typeof body?.message === "string"
              ? body.message
              : "Deck insights could not be loaded.",
          );
          return;
        }
        const parsed = readDailyDeckInsights(body);
        if (!parsed) {
          setInsights(null);
          setError("Deck insights returned an unexpected response.");
          return;
        }
        setInsights(parsed);
      } catch {
        if (active) {
          setInsights(null);
          setError(
            controller.signal.aborted
              ? "Deck insights took too long to load. Please try again."
              : "Deck insights could not be reached.",
          );
        }
      } finally {
        clearTimeout(timeout);
        if (active) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      }
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
      onLoadingChange?.(false);
    };
  }, [activeFilters, onLoadingChange]);

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
  const byDate = new Map(insights.days.map((day) => [day.date, day]));

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Counts describe the person who received the deck. Days with fewer than{" "}
        {insights.minimumBucket} decks are hidden. Pass and like are not shown
        separately.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Decks generated"
          empty={dates.length === 0}
        >
          <VerticalBarChart
            title="Decks generated"
            dates={dates}
            series={[
              {
                label: "Decks generated",
                colorClass: "fill-[#f43f5e]",
                getValue: (date) => byDate.get(date)?.decksGenerated ?? 0,
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Total candidate slots"
          empty={dates.length === 0}
        >
          <VerticalBarChart
            title="Total candidate slots"
            dates={dates}
            series={[
              {
                label: "Candidate slots",
                colorClass: "fill-[#fb7185]",
                getValue: (date) => byDate.get(date)?.totalCandidateSlots ?? 0,
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Average deck size"
          empty={dates.length === 0}
        >
          <VerticalBarChart
            title="Average deck size"
            dates={dates}
            series={[
              {
                label: "Average size",
                colorClass: "fill-[#f472b6]",
                getValue: (date) => byDate.get(date)?.averageDeckSize ?? 0,
                formatValue: formatDecimal,
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Completed decks & rate"
          empty={dates.length === 0}
        >
          <VerticalBarChart
            title="Completed decks"
            dates={dates}
            series={[
              {
                label: "Completed decks",
                colorClass: "fill-[#f43f5e]",
                getValue: (date) => byDate.get(date)?.completedDecks ?? 0,
              },
            ]}
          />
        </ChartCard>
      </div>

      {insights.days.length > 0 ? (
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
                {insights.days.map((day) => (
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
      ) : null}
    </div>
  );
}
