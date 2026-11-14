import {
  isCalendarDate,
  isCount,
  isFiniteNonNegative,
  parseInsightsFilterQuery,
} from "./filters";

export type DailyDeckDay = {
  date: string;
  decksGenerated: number;
  totalCandidateSlots: number;
  averageDeckSize: number;
  completedDecks: number;
  completionRate: number;
};

export type DailyDeckInsights = {
  minimumBucket: number;
  days: DailyDeckDay[];
};

export function dailyDeckQuery(
  params: URLSearchParams,
): { ok: true; query: string } | { ok: false; message: string } {
  return parseInsightsFilterQuery(params);
}

export function readDailyDeckInsights(body: unknown): DailyDeckInsights | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (
    !Number.isInteger(record.minimumBucket) ||
    Number(record.minimumBucket) < 5
  ) {
    return null;
  }
  if (!Array.isArray(record.days)) return null;

  const days: DailyDeckDay[] = [];
  for (const day of record.days) {
    if (!day || typeof day !== "object") return null;
    const item = day as Record<string, unknown>;
    if (typeof item.date !== "string" || !isCalendarDate(item.date)) {
      return null;
    }
    if (
      !isCount(item.decksGenerated) ||
      item.decksGenerated < Number(record.minimumBucket)
    ) {
      return null;
    }
    if (!isCount(item.totalCandidateSlots) || !isCount(item.completedDecks)) {
      return null;
    }
    if (
      !isFiniteNonNegative(item.averageDeckSize) ||
      !isFiniteNonNegative(item.completionRate) ||
      item.completionRate > 1 ||
      item.completedDecks > item.decksGenerated
    ) {
      return null;
    }
    days.push({
      date: item.date,
      decksGenerated: item.decksGenerated,
      totalCandidateSlots: item.totalCandidateSlots,
      averageDeckSize: item.averageDeckSize,
      completedDecks: item.completedDecks,
      completionRate: item.completionRate,
    });
  }

  return { minimumBucket: Number(record.minimumBucket), days };
}
