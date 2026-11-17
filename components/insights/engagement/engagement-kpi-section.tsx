import type { EngagementInsights } from "@/lib/insights/engagement";
import { formatCount, formatDecimal } from "../formatters";
import { KpiCard } from "../kpi-card";
import type { EngagementSummary } from "./engagement-summary";

export function EngagementKpiSection({
  insights,
  summary,
}: {
  insights: EngagementInsights;
  summary: EngagementSummary;
}) {
  const { likes, mutualMatches, chats, messages } = insights.totals;
  const {
    likesStats,
    chatsStats,
    messagesStats,
    mutualMatchRatePct,
    oneWayLikesCount,
    avgMessagesPerChat,
  } = summary;

  return (
    <section
      aria-label="Engagement metrics"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <KpiCard
        label="Like pairs"
        value={likes !== null ? formatCount(likes) : null}
        badge={
          mutualMatchRatePct !== null
            ? {
                text: `${formatDecimal(mutualMatchRatePct)}% Mutual`,
                tone: "pink",
              }
            : null
        }
        subtext="Pairs by first-like timestamp (matches.created_at)"
        footer={
          likesStats.avg !== null
            ? {
                label: "Daily avg:",
                value: `${formatDecimal(likesStats.avg)} / day`,
              }
            : null
        }
      />
      <KpiCard
        label="Mutual matches"
        value={mutualMatches !== null ? formatCount(mutualMatches) : null}
        valueAccentClass="text-[#f43f5e]"
        badge={
          mutualMatches !== null
            ? {
                text: "Currently stored",
                tone: "pink",
              }
            : null
        }
        subtext="Stored rows where both sides liked each other"
        footer={
          oneWayLikesCount !== null
            ? {
                label: "One-way remaining:",
                value: formatCount(oneWayLikesCount),
              }
            : null
        }
      />
      <KpiCard
        label="New chats"
        value={chats !== null ? formatCount(chats) : null}
        badge={
          chatsStats.avg !== null
            ? {
                text: `${formatDecimal(chatsStats.avg)} / day`,
                tone: "neutral",
              }
            : null
        }
        subtext="Created on mutual match (chats.created_at)"
        footer={
          chatsStats.peak
            ? {
                label: "Peak day:",
                value: `${chatsStats.peak.date.slice(5)} (${formatCount(chatsStats.peak.count)})`,
                valueClass: "text-[#f43f5e]",
              }
            : null
        }
      />
      <KpiCard
        label="Messages sent"
        value={messages !== null ? formatCount(messages) : null}
        badge={
          avgMessagesPerChat !== null
            ? {
                text: `${formatDecimal(avgMessagesPerChat)} / chat`,
                tone: "positive",
              }
            : null
        }
        subtext="All stored messages counted by send_at"
        footer={
          messagesStats.avg !== null
            ? {
                label: "Daily avg:",
                value: `${formatDecimal(messagesStats.avg)} / day`,
              }
            : null
        }
      />
    </section>
  );
}
