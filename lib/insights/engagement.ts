import { readDailySeries, readOptionalMinCount } from "./audience-readers";
import type {
  DailyMessageTypePoint,
  EngagementInsights,
  EngagementTotals,
} from "./engagement-types";
import { isCalendarDate, isCount, parseInsightsFilterQuery } from "./filters";

export {
  type DailyMessageTypePoint,
  type EngagementInsights,
  type EngagementTotals,
} from "./engagement-types";

export function engagementInsightsQuery(
  params: URLSearchParams,
): { ok: true; query: string } | { ok: false; message: string } {
  return parseInsightsFilterQuery(params);
}

export function readEngagementInsights(
  body: unknown,
): EngagementInsights | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;

  if (
    !Number.isInteger(record.minimumBucket) ||
    Number(record.minimumBucket) < 5
  ) {
    return null;
  }
  const minimumBucket = Number(record.minimumBucket);

  const totals = readEngagementTotals(record.totals, minimumBucket);
  if (!totals) return null;

  const likesPerDay = readDailySeries(record.likesPerDay, minimumBucket);
  const chatsPerDay = readDailySeries(record.chatsPerDay, minimumBucket);
  const messagesPerDay = readDailySeries(record.messagesPerDay, minimumBucket);
  const messagesByTypePerDay = readMessageTypeSeries(
    record.messagesByTypePerDay,
    minimumBucket,
  );

  if (
    !likesPerDay ||
    !chatsPerDay ||
    !messagesPerDay ||
    !messagesByTypePerDay
  ) {
    return null;
  }

  return {
    minimumBucket,
    totals,
    likesPerDay,
    chatsPerDay,
    messagesPerDay,
    messagesByTypePerDay,
  };
}

function readEngagementTotals(
  raw: unknown,
  minimumBucket: number,
): EngagementTotals | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const likes = readOptionalMinCount(obj.likes, minimumBucket);
  const mutualMatches = readOptionalMinCount(obj.mutualMatches, minimumBucket);
  const chats = readOptionalMinCount(obj.chats, minimumBucket);
  const messages = readOptionalMinCount(obj.messages, minimumBucket);

  if (
    likes === undefined ||
    mutualMatches === undefined ||
    chats === undefined ||
    messages === undefined
  ) {
    return null;
  }

  return { likes, mutualMatches, chats, messages };
}

function readMessageTypeSeries(
  raw: unknown,
  minimumBucket: number,
): DailyMessageTypePoint[] | null {
  if (!Array.isArray(raw)) return null;

  const byDate = new Map<string, { text: number; image: number }>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.date !== "string" || !isCalendarDate(item.date)) {
      return null;
    }
    if (!isCount(item.text) || !isCount(item.image)) return null;
    const prev = byDate.get(item.date) ?? { text: 0, image: 0 };
    byDate.set(item.date, {
      text: prev.text + item.text,
      image: prev.image + item.image,
    });
  }

  // Omit the day if either type count is below minimumBucket so subtracting
  // against messagesPerDay cannot reveal small text/image counts.
  return Array.from(byDate.entries())
    .filter(([, counts]) => counts.text >= minimumBucket && counts.image >= minimumBucket)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      text: counts.text,
      image: counts.image,
    }));
}
