import { Badge } from "@/components/ui/badge";
import type { DailyCountPoint } from "@/lib/insights/audience-types";
import type { EngagementInsights } from "@/lib/insights/engagement";
import { ChartCard } from "../chart-card";
import { VerticalBarChart } from "../charts/bar-chart";
import { SegmentedBar } from "../charts/segmented-bar";
import { formatCount, formatDecimal, formatPercent } from "../formatters";
import type { EngagementSummary } from "./engagement-summary";

function buildDailyBarProps(seriesLabel: string, points: DailyCountPoint[]) {
  const counts = new Map(points.map((d) => [d.date, d.count]));
  return {
    highlightPeak: true,
    categories: points.map((d) => ({
      key: d.date,
      label: d.date,
      shortLabel: d.date.slice(5),
    })),
    series: [
      {
        label: seriesLabel,
        colorClass: "bg-[#fb7185]",
        getColorClass: (_key: string, isPeak: boolean) =>
          isPeak ? "bg-[#f43f5e] ring-2 ring-pink-300" : "bg-[#fb7185]",
        getValue: (date: string) => counts.get(date) ?? 0,
      },
    ],
  };
}

export function EngagementChartsSection({
  insights,
  summary,
}: {
  insights: EngagementInsights;
  summary: EngagementSummary;
}) {
  const { mutualMatches, chats } = insights.totals;
  const {
    mutualMatchRatePct,
    avgMessagesPerChat,
    oneWayLikesCount,
    typeTextTotal,
    typeImageTotal,
    typeMeasuredTotal,
    messageTypeMap,
  } = summary;

  const showMatchSplit =
    mutualMatches !== null &&
    oneWayLikesCount !== null &&
    mutualMatches + oneWayLikesCount > 0;

  return (
    <section className="grid items-start gap-6 lg:grid-cols-12">
      <ChartCard
        className="lg:col-span-12"
        title="Mutual matches currently stored & conversion rates"
        description="Stored mutual pairs compared against like pairs and resulting chats (counts only from API; rates derived client-side)."
        headerAction={
          mutualMatchRatePct !== null ? (
            <Badge variant="soft">
              {formatDecimal(mutualMatchRatePct)}% Mutual rate
            </Badge>
          ) : null
        }
        empty={mutualMatches === null}
        emptyMessage="Hidden when fewer than 5 mutual matches are stored in the selected range."
      >
        <div className="space-y-4">
          {showMatchSplit ? (
            <SegmentedBar
              items={[
                {
                  key: "mutual",
                  label: "Mutual matches (both liked)",
                  count: mutualMatches,
                },
                ...(oneWayLikesCount > 0
                  ? [
                      {
                        key: "one-way",
                        label: "One-way like pairs",
                        count: oneWayLikesCount,
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-pink-100 bg-pink-50/50 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                Mutual matches stored
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#f43f5e] tabular-nums">
                {mutualMatches !== null ? formatCount(mutualMatches) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-pink-100 bg-white px-3.5 py-2.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                New chats created
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                {chats !== null ? formatCount(chats) : "—"}
              </p>
              <p className="text-[11px] text-slate-400">
                Created on mutual match (chats.created_at)
              </p>
            </div>
            <div className="rounded-xl border border-pink-100 bg-white px-3.5 py-2.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                Messages per chat
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                {avgMessagesPerChat !== null
                  ? formatDecimal(avgMessagesPerChat)
                  : "—"}
              </p>
              <p className="text-[11px] text-slate-400">
                Average stored messages
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        className="lg:col-span-12"
        title="Likes per day"
        description="Like rows currently stored, timestamped by the first like in each pair (matches.created_at)."
        empty={insights.likesPerDay.length === 0}
      >
        <VerticalBarChart
          title="Likes per day"
          {...buildDailyBarProps("Like pairs", insights.likesPerDay)}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-12"
        title="New chats per day"
        description="Chats created when a match becomes mutual (chats.created_at)."
        empty={insights.chatsPerDay.length === 0}
      >
        <VerticalBarChart
          title="New chats per day"
          {...buildDailyBarProps("New chats", insights.chatsPerDay)}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-12"
        title="Messages per day"
        description="All stored messages counted by messages.send_at (content & sender never selected)."
        empty={insights.messagesPerDay.length === 0}
      >
        <VerticalBarChart
          title="Messages per day"
          {...buildDailyBarProps("Messages", insights.messagesPerDay)}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-12"
        title="Messages by type per day"
        description="Daily counts split between text and image messages."
        headerAction={
          typeMeasuredTotal > 0 ? (
            <Badge variant="soft">
              {formatPercent(typeTextTotal, typeMeasuredTotal)} text ·{" "}
              {formatPercent(typeImageTotal, typeMeasuredTotal)} image
            </Badge>
          ) : null
        }
        empty={insights.messagesByTypePerDay.length === 0}
        emptyMessage="Hidden on days where either text or image count is under 5."
      >
        <VerticalBarChart
          title="Messages by type per day"
          categories={insights.messagesByTypePerDay.map((d) => ({
            key: d.date,
            label: d.date,
            shortLabel: d.date.slice(5),
          }))}
          series={[
            {
              label: "Text",
              colorClass: "bg-[#fb7185]",
              getValue: (date) => messageTypeMap.get(date)?.text ?? 0,
            },
            {
              label: "Image",
              colorClass: "bg-[#fbcfe8] border border-[#f9a8d4]/70",
              getValue: (date) => messageTypeMap.get(date)?.image ?? 0,
            },
          ]}
        />
      </ChartCard>
    </section>
  );
}
