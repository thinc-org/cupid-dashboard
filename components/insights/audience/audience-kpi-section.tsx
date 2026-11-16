import type { AudienceInsights } from "@/lib/insights/audience";
import { formatCount, formatDecimal, formatPercent } from "../formatters";
import { KpiCard } from "../kpi-card";
import type { AudienceSummary } from "./audience-summary";

export function AudienceKpiSection({
  insights,
  summary,
}: {
  insights: AudienceInsights;
  summary: AudienceSummary;
}) {
  const {
    totalSignups,
    previousSignups,
    signupDelta,
    onboardedTotal,
    activeTotal,
    avgDailySignups,
    peakSignupDay,
  } = summary;

  return (
    <section
      aria-label="Key metrics"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <KpiCard
        label="Total signups"
        value={totalSignups !== null ? formatCount(totalSignups) : null}
        badge={
          signupDelta !== null
            ? {
                text: `${signupDelta >= 0 ? "+" : ""}${formatDecimal(signupDelta)}%`,
                tone:
                  signupDelta > 0
                    ? "positive"
                    : signupDelta < 0
                      ? "negative"
                      : "neutral",
              }
            : null
        }
        subtext="Includes incomplete onboarding"
        footer={
          previousSignups !== null
            ? {
                label: "Previous period:",
                value: formatCount(previousSignups),
              }
            : null
        }
      />
      <KpiCard
        label="Onboarded profiles"
        value={
          insights.onboardedStatus
            ? formatCount(insights.onboardedStatus.onboarded)
            : null
        }
        valueAccentClass="text-[#f43f5e]"
        badge={
          insights.onboardedStatus
            ? {
                text: `${formatPercent(insights.onboardedStatus.onboarded, onboardedTotal)} Rate`,
                tone: "pink",
              }
            : null
        }
        subtext={
          insights.onboardedStatus
            ? "Full profile created"
            : "Split hidden when either cohort is under 5"
        }
        footer={
          insights.onboardedStatus
            ? {
                label: "Incomplete:",
                value: `${formatCount(insights.onboardedStatus.notOnboarded)} (${formatPercent(insights.onboardedStatus.notOnboarded, onboardedTotal)})`,
              }
            : null
        }
      />
      <KpiCard
        label="Current account state"
        value={
          insights.pausedStatus
            ? `${formatCount(insights.pausedStatus.active)} Active`
            : null
        }
        badge={
          insights.pausedStatus
            ? {
                text: `${formatPercent(insights.pausedStatus.paused, activeTotal)} Paused`,
                tone: "neutral",
              }
            : null
        }
        subtext={
          insights.pausedStatus
            ? "Current status snapshot"
            : "Split hidden when either side is under 5"
        }
        footer={
          insights.pausedStatus
            ? {
                label: "Currently paused:",
                value: `${formatCount(insights.pausedStatus.paused)} paused`,
                valueClass: "text-emerald-600",
              }
            : null
        }
      />
      <KpiCard
        label="Daily run-rate"
        value={
          avgDailySignups !== null
            ? `${formatDecimal(avgDailySignups)} / day`
            : null
        }
        badge={
          insights.signupsPerDay.length > 0
            ? {
                text: `${insights.signupsPerDay.length} Days`,
                tone: "pink",
              }
            : null
        }
        subtext="Average daily signups"
        footer={
          peakSignupDay
            ? {
                label: "Peak day:",
                value: `${peakSignupDay.date.slice(5)} (${formatCount(peakSignupDay.count)})`,
                valueClass: "text-[#f43f5e]",
              }
            : null
        }
      />
    </section>
  );
}
