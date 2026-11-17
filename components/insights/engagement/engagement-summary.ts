import type { DailyCountPoint } from "@/lib/insights/audience-types";
import type { EngagementInsights } from "@/lib/insights/engagement";

export type EngagementSummary = ReturnType<typeof computeEngagementSummary>;

type DailyStats = {
  avg: number | null;
  peak: DailyCountPoint | null;
};

function computeDailyStats(series: DailyCountPoint[]): DailyStats {
  if (series.length === 0) return { avg: null, peak: null };
  let total = 0;
  let peak: DailyCountPoint | null = null;
  for (const point of series) {
    total += point.count;
    if (!peak || point.count > peak.count) peak = point;
  }
  return {
    avg: total / series.length,
    peak,
  };
}

export function computeEngagementSummary(insights: EngagementInsights) {
  const { likes, mutualMatches, chats, messages } = insights.totals;

  const likesStats = computeDailyStats(insights.likesPerDay);
  const chatsStats = computeDailyStats(insights.chatsPerDay);
  const messagesStats = computeDailyStats(insights.messagesPerDay);

  const mutualMatchRatePct =
    mutualMatches !== null && likes !== null && likes > 0
      ? (mutualMatches / likes) * 100
      : null;
  const avgMessagesPerChat =
    messages !== null && chats !== null && chats > 0 ? messages / chats : null;

  // Only expose the one-way complement when it is either 0 or >= minimumBucket
  // so subtracting mutualMatches from likes cannot reveal a <5 residual cohort.
  const oneWayRaw =
    likes !== null && mutualMatches !== null && likes >= mutualMatches
      ? likes - mutualMatches
      : null;
  const oneWayLikesCount =
    oneWayRaw === null
      ? null
      : oneWayRaw === 0 || oneWayRaw >= insights.minimumBucket
        ? oneWayRaw
        : null;

  let typeTextTotal = 0;
  let typeImageTotal = 0;
  for (const day of insights.messagesByTypePerDay) {
    typeTextTotal += day.text;
    typeImageTotal += day.image;
  }
  const typeMeasuredTotal = typeTextTotal + typeImageTotal;

  const messageTypeMap = new Map(
    insights.messagesByTypePerDay.map((d) => [d.date, d]),
  );

  return {
    likesStats,
    chatsStats,
    messagesStats,
    mutualMatchRatePct,
    avgMessagesPerChat,
    oneWayLikesCount,
    typeTextTotal,
    typeImageTotal,
    typeMeasuredTotal,
    messageTypeMap,
  };
}
