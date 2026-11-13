"use client";

import { Activity, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  readAudienceInsights,
  type AudienceInsights,
  type BucketCount,
} from "@/lib/insights/audience";
import { formatInsightLabel, type LabelDimension } from "@/lib/insights/enums";
import {
  buildInsightsQueryString,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { ChartCard } from "./chart-card";
import { VerticalBarChart } from "./charts/bar-chart";
import { DonutChart } from "./charts/donut-chart";
import {
  HorizontalBarList,
  type LabeledBucket,
} from "./charts/horizontal-bar-list";
import { HistogramChart } from "./charts/histogram-chart";
import { MetricList } from "./charts/metric-list";
import { SegmentedBar } from "./charts/segmented-bar";
import { TagPills } from "./charts/tag-pills";
import { formatCount, formatDecimal, formatPercent } from "./formatters";
import { KpiCard } from "./kpi-card";

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
  const [insights, setInsights] = useState<AudienceInsights | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    onLoadingChange?.(true);
    setError("");

    void (async () => {
      try {
        const query = buildInsightsQueryString(filters);
        const mockParam =
          useDevMock && process.env.NODE_ENV !== "production" ? "&mock=1" : "";
        const response = await fetch(`/api/insights/users?${query}${mockParam}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null);
        if (!active) return;

        if (!response.ok) {
          setInsights(null);
          setError(
            typeof body?.message === "string"
              ? body.message
              : "Audience insights could not be loaded.",
          );
          return;
        }
        const parsed = readAudienceInsights(body);
        if (!parsed) {
          setInsights(null);
          setError("Audience insights returned an unexpected response.");
          return;
        }
        setInsights(parsed);
      } catch {
        if (active) {
          setInsights(null);
          setError(
            controller.signal.aborted
              ? "Audience insights took too long to load. Please try again."
              : "Audience insights could not be reached.",
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
  }, [filters, useDevMock, onLoadingChange]);

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

  const signupMap = new Map(
    insights.signupsPerDay.map((d) => [d.date, d.count]),
  );
  const onboardedMap = new Map(
    insights.onboardedPerDay.map((d) => [d.date, d.count]),
  );
  const dailyDates = Array.from(
    new Set([
      ...insights.signupsPerDay.map((d) => d.date),
      ...insights.onboardedPerDay.map((d) => d.date),
    ]),
  ).sort();

  const totalSignups = insights.totals.users;
  const previousSignups = insights.totals.previousUsers;
  const signupDelta =
    totalSignups !== null && previousSignups !== null && previousSignups > 0
      ? ((totalSignups - previousSignups) / previousSignups) * 100
      : null;

  const onboardedTotal = insights.onboardedStatus
    ? insights.onboardedStatus.onboarded + insights.onboardedStatus.notOnboarded
    : 0;

  const activeTotal = insights.pausedStatus
    ? insights.pausedStatus.active + insights.pausedStatus.paused
    : 0;

  const avgDailySignups =
    insights.signupsPerDay.length > 0
      ? insights.signupsPerDay.reduce((sum, d) => sum + d.count, 0) /
        insights.signupsPerDay.length
      : null;
  const peakSignupDay = insights.signupsPerDay.reduce<
    { date: string; count: number } | null
  >(
    (best, day) => (!best || day.count > best.count ? day : best),
    null,
  );

  return (
    <div className="space-y-6">
      {/* KPI Header Metrics */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total signups"
          value={totalSignups !== null ? formatCount(totalSignups) : null}
          delta={
            signupDelta !== null
              ? {
                  text: `${signupDelta >= 0 ? "+" : ""}${formatDecimal(signupDelta)}% vs prev`,
                  tone:
                    signupDelta > 0
                      ? "positive"
                      : signupDelta < 0
                        ? "negative"
                        : "neutral",
                }
              : null
          }
          subtext="All users in range, including incomplete onboarding"
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Onboarded profiles"
          value={
            insights.onboardedStatus
              ? formatCount(insights.onboardedStatus.onboarded)
              : null
          }
          subtext={
            insights.onboardedStatus
              ? `${formatPercent(insights.onboardedStatus.onboarded, onboardedTotal)} conversion · ${formatCount(insights.onboardedStatus.notOnboarded)} incomplete`
              : "Split hidden when either cohort is under 5"
          }
          icon={<CheckCircle2 className="size-4" />}
        />
        <KpiCard
          label="Current account state"
          value={
            insights.pausedStatus
              ? `${formatCount(insights.pausedStatus.active)} active`
              : null
          }
          subtext={
            insights.pausedStatus
              ? `${formatCount(insights.pausedStatus.paused)} paused now (${formatPercent(insights.pausedStatus.paused, activeTotal)})`
              : "Active/paused split hidden when either side is under 5"
          }
          icon={<Activity className="size-4" />}
        />
        <KpiCard
          label="Daily run-rate"
          value={
            avgDailySignups !== null
              ? `${formatDecimal(avgDailySignups)} / day`
              : null
          }
          subtext={
            peakSignupDay
              ? `Peak: ${peakSignupDay.date} (${formatCount(peakSignupDay.count)} signups)`
              : "No days with at least 5 signups"
          }
          icon={<TrendingUp className="size-4" />}
        />
      </section>

      {/* Signups vs Onboarded Dual Bar Chart + Donut Health Cards */}
      <section className="grid gap-6 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-12"
          title="Signups vs onboarded accounts per day"
          description="Compares daily registrations (users.created_at) and completed profiles (profiles.created_at). Days with fewer than 5 are omitted."
          empty={dailyDates.length === 0}
        >
          <div className="space-y-4">
            <VerticalBarChart
              title="Signups vs onboarded accounts per day"
              dates={dailyDates}
              series={[
                {
                  label: "Signups",
                  colorClass: "fill-[#f43f5e]",
                  getValue: (date) => signupMap.get(date) ?? 0,
                },
                {
                  label: "Onboarded",
                  colorClass: "fill-[#fda4af]",
                  getValue: (date) => onboardedMap.get(date) ?? 0,
                },
              ]}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Signups</th>
                    <th className="py-2 font-medium">Onboarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 tabular-nums">
                  {dailyDates.map((date) => (
                    <tr key={date}>
                      <td className="py-1.5 pr-3 font-medium text-foreground">
                        {date}
                      </td>
                      <td className="py-1.5 pr-3">
                        {signupMap.has(date)
                          ? formatCount(signupMap.get(date) ?? 0)
                          : "<5 (hidden)"}
                      </td>
                      <td className="py-1.5">
                        {onboardedMap.has(date)
                          ? formatCount(onboardedMap.get(date) ?? 0)
                          : "<5 (hidden)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          className="lg:col-span-6"
          title="Onboarded vs not onboarded"
          description="Current conversion split for the selected filter."
          empty={!insights.onboardedStatus}
          emptyMessage="Hidden because either onboarded or incomplete count is under 5."
        >
          {insights.onboardedStatus ? (
            <DonutChart
              title="Onboarded vs not onboarded"
              centerLabel="Onboarded"
              segments={[
                {
                  label: "Onboarded",
                  count: insights.onboardedStatus.onboarded,
                  strokeClass: "stroke-[#f43f5e]",
                  dotClass: "bg-[#f43f5e]",
                },
                {
                  label: "Not onboarded",
                  count: insights.onboardedStatus.notOnboarded,
                  strokeClass: "stroke-[#ffe4e6]",
                  dotClass: "bg-[#fda4af]",
                },
              ]}
            />
          ) : null}
        </ChartCard>

        <ChartCard
          className="lg:col-span-6"
          title="Paused vs active accounts"
          description="Current account state from paused_at (not pause history)."
          empty={!insights.pausedStatus}
          emptyMessage="Hidden because either active or paused count is under 5."
        >
          {insights.pausedStatus ? (
            <DonutChart
              title="Paused vs active accounts"
              centerLabel="Active"
              segments={[
                {
                  label: "Active",
                  count: insights.pausedStatus.active,
                  strokeClass: "stroke-[#fb7185]",
                  dotClass: "bg-[#fb7185]",
                },
                {
                  label: "Paused now",
                  count: insights.pausedStatus.paused,
                  strokeClass: "stroke-[#ffe4e6]",
                  dotClass: "bg-[#fda4af]",
                },
              ]}
            />
          ) : null}
        </ChartCard>
      </section>

      {/* Demographics & Intent */}
      <section className="grid gap-6 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title="Faculty breakdown"
          description="Headcount per campus faculty; faculties with fewer than 5 accounts roll into Other."
          empty={insights.faculty.length === 0}
        >
          <HorizontalBarList items={toLabeled("faculty", insights.faculty)} />
        </ChartCard>

        <ChartCard
          className="lg:col-span-5"
          title="Academic standing (Year)"
          description="Distribution across study years 1 to 6."
          empty={insights.year.length === 0}
        >
          <HistogramChart
            title="Academic standing by year"
            items={toLabeled("year", insights.year)}
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-6"
          title="Gender identity breakdown"
          description="Self-declared gender pool balance."
          empty={insights.gender.length === 0}
        >
          <SegmentedBar items={toLabeled("gender", insights.gender)} />
        </ChartCard>

        <ChartCard
          className="lg:col-span-6"
          title="Age distribution bands"
          description="Computed dynamically into cohort bands from date_of_birth (birth dates are never returned)."
          headerAction={
            insights.ageBands.medianAge !== null ? (
              <Badge variant="soft" className="tabular-nums">
                Median: {formatDecimal(insights.ageBands.medianAge)} yrs
              </Badge>
            ) : null
          }
          empty={insights.ageBands.buckets.length === 0}
        >
          <HistogramChart
            title="Age distribution bands"
            items={toLabeled("ageBand", insights.ageBands.buckets)}
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-6"
          title="Relationship goals & intent"
          description="Ranked intent configured during onboarding."
          empty={insights.relationshipGoal.length === 0}
        >
          <HorizontalBarList
            items={toLabeled("relationshipGoal", insights.relationshipGoal)}
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-6"
          title="Core value alignment"
          description="Multi-select value tags; a person with multiple values counts once per tag."
          empty={insights.valueTags.length === 0}
        >
          <HorizontalBarList
            items={toLabeled("value", insights.valueTags)}
            ranked={false}
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-12"
          title="Top interest tags"
          description="Multi-value frequency; each person counts once per selected interest tag."
          empty={insights.interestTags.length === 0}
        >
          <TagPills items={toLabeled("interest", insights.interestTags)} />
        </ChartCard>
      </section>

      {/* Match Filters Configured */}
      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Match filter preferences (
            <code className="rounded bg-secondary px-1.5 py-0.5 text-sm font-medium">
              filter_preferences
            </code>
            )
          </h3>
          <p className="text-xs text-muted-foreground">
            One count per selected faculty, year, gender interest, and
            relationship goal. Empty preference lists are counted separately as
            &ldquo;No restrictions (Open Deck)&rdquo;.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard
            title="Preferred faculties"
            empty={insights.matchFilters.faculties.length === 0}
          >
            <MetricList
              items={toLabeled("faculty", insights.matchFilters.faculties)}
            />
          </ChartCard>
          <ChartCard
            title="Preferred years"
            empty={insights.matchFilters.years.length === 0}
          >
            <MetricList
              items={toLabeled("year", insights.matchFilters.years)}
            />
          </ChartCard>
          <ChartCard
            title="Preferred gender interest"
            empty={insights.matchFilters.genderInterest.length === 0}
          >
            <MetricList
              items={toLabeled("gender", insights.matchFilters.genderInterest)}
            />
          </ChartCard>
          <ChartCard
            title="Preferred relationship goals"
            empty={insights.matchFilters.relationshipGoals.length === 0}
          >
            <MetricList
              items={toLabeled(
                "relationshipGoal",
                insights.matchFilters.relationshipGoals,
              )}
            />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

function toLabeled(
  dimension: LabelDimension,
  buckets: BucketCount[],
): LabeledBucket[] {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: formatInsightLabel(dimension, bucket.key),
    count: bucket.count,
  }));
}
