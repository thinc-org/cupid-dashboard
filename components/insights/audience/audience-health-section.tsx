import { Badge } from "@/components/ui/badge";
import type { AudienceInsights } from "@/lib/insights/audience";
import { ChartCard } from "../chart-card";
import { VerticalBarChart } from "../charts/bar-chart";
import { DonutChart } from "../charts/donut-chart";
import type { AudienceSummary } from "./audience-summary";

export function AudienceHealthSection({
  insights,
  summary,
}: {
  insights: AudienceInsights;
  summary: AudienceSummary;
}) {
  const { dailyDates, signupMap, onboardedMap } = summary;

  return (
    <section className="grid items-start gap-6 lg:grid-cols-12">
      <ChartCard
        className="lg:col-span-12"
        title="Signups vs onboarded accounts per day"
        description="Compares daily signups and completed onboarding."
        empty={dailyDates.length === 0}
      >
        <VerticalBarChart
          title="Signups vs onboarded accounts per day"
          highlightPeak
          categories={dailyDates.map((date) => ({
            key: date,
            label: date,
            shortLabel: date.slice(5),
          }))}
          series={[
            {
              label: "Signups",
              colorClass: "bg-[#fb7185]",
              getColorClass: (_key, isPeak) =>
                isPeak ? "bg-[#f43f5e] ring-2 ring-pink-300" : "bg-[#fb7185]",
              getValue: (date) => signupMap.get(date) ?? 0,
            },
            {
              label: "Onboarded",
              colorClass: "bg-[#fbcfe8] border border-[#f9a8d4]/70",
              getColorClass: (_key, isPeak) =>
                isPeak
                  ? "bg-[#f9a8d4] border border-[#f472b6]"
                  : "bg-[#fbcfe8] border border-[#f9a8d4]/70",
              getValue: (date) => onboardedMap.get(date) ?? 0,
            },
          ]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Onboarded vs not onboarded"
        headerAction={<Badge variant="soft">Conversion</Badge>}
        empty={!insights.onboardedStatus}
        emptyMessage="Hidden because either onboarded or incomplete count is under 5."
      >
        {insights.onboardedStatus ? (
          <DonutChart
            title="Onboarded vs not onboarded"
            centerLabel="Complete"
            segments={[
              {
                label: "Onboarded",
                count: insights.onboardedStatus.onboarded,
                strokeClass: "stroke-[#f472b6]",
                dotClass: "bg-[#f472b6]",
              },
              {
                label: "Not onboarded",
                count: insights.onboardedStatus.notOnboarded,
                strokeClass: "stroke-[#fce7f3]",
                dotClass: "bg-[#fce7f3] border border-[#fbcfe8]",
              },
            ]}
          />
        ) : null}
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Paused vs active accounts"
        description="Current account status."
        headerAction={<Badge variant="emerald">Deck Health</Badge>}
        empty={!insights.pausedStatus}
        emptyMessage="Hidden because either active or paused count is under 5."
      >
        {insights.pausedStatus ? (
          <DonutChart
            title="Paused vs active accounts"
            centerLabel="Active"
            centerLabelClass="text-emerald-600"
            segments={[
              {
                label: "Active",
                count: insights.pausedStatus.active,
                strokeClass: "stroke-emerald-500",
                dotClass: "bg-emerald-500",
              },
              {
                label: "Paused now",
                count: insights.pausedStatus.paused,
                strokeClass: "stroke-amber-500",
                dotClass: "bg-amber-500",
              },
            ]}
          />
        ) : null}
      </ChartCard>
    </section>
  );
}
