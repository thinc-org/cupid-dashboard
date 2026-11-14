import type { AudienceInsights, BucketCount } from "@/lib/insights/audience";
import { formatInsightLabel, type LabelDimension } from "@/lib/insights/enums";
import type { LabeledBucket } from "../charts/horizontal-bar-list";

export type AudienceSummary = ReturnType<typeof computeAudienceSummary>;

export function computeAudienceSummary(insights: AudienceInsights) {
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
  >((best, day) => (!best || day.count > best.count ? day : best), null);

  return {
    signupMap,
    onboardedMap,
    dailyDates,
    totalSignups,
    previousSignups,
    signupDelta,
    onboardedTotal,
    activeTotal,
    avgDailySignups,
    peakSignupDay,
  };
}

export function toLabeled(
  dimension: LabelDimension,
  buckets: BucketCount[],
): LabeledBucket[] {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: formatInsightLabel(dimension, bucket.key),
    count: bucket.count,
  }));
}

export function buildBucketBarProps(
  buckets: BucketCount[],
  dimension: LabelDimension,
) {
  const labeled = toLabeled(dimension, buckets);
  const counts = new Map(labeled.map((item) => [item.key, item.count]));
  return {
    highlightPeak: true,
    categories: labeled.map(({ key, label }) => ({ key, label })),
    series: [
      {
        label: "Users",
        colorClass: "bg-[#f9a8d4]",
        getColorClass: (_key: string, isPeak: boolean) =>
          isPeak ? "bg-[#f472b6]" : "bg-[#f9a8d4]",
        getValue: (key: string) => counts.get(key) ?? 0,
      },
    ],
  };
}
