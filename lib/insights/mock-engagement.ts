import type { EngagementInsights } from "./engagement";
import { countActiveProfileFilters, enumerateIsoDates } from "./filters";

export function buildDevMockEngagementInsights(
  queryString: string,
): EngagementInsights | null {
  if (process.env.NODE_ENV === "production") return null;

  const params = new URLSearchParams(queryString);
  const from = params.get("from") || "2026-11-01";
  const to = params.get("to") || "2026-11-14";

  const scale = Math.max(0.2, 1 - countActiveProfileFilters(params) * 0.22);
  const s = (n: number) => Math.max(1, Math.round(n * scale));

  const dayList = enumerateIsoDates(from, to);

  const likesPerDay = dayList.map((date, idx) => ({
    date,
    count: s(42 + ((idx * 11) % 37)),
  }));
  const chatsPerDay = dayList.map((date, idx) => ({
    date,
    count: s(11 + ((idx * 5) % 16)),
  }));
  const messagesByTypePerDay = dayList.map((date, idx) => ({
    date,
    text: s(88 + ((idx * 23) % 72)),
    image: s(9 + ((idx * 4) % 15)),
  }));
  const messagesPerDay = messagesByTypePerDay.map((day, idx) => ({
    date: day.date,
    // Include simulated non-text/non-image messages (e.g. stickers) in total messagesPerDay.
    count: day.text + day.image + s(2 + (idx % 5)),
  }));

  const likes = likesPerDay.reduce((sum, d) => sum + d.count, 0);
  const chats = chatsPerDay.reduce((sum, d) => sum + d.count, 0);
  // Keep simulated mutualMatches slightly above chats for a realistic cohort view.
  const mutualMatches = Math.min(
    likes,
    chats + s(Math.max(5, Math.round(dayList.length * 1.4))),
  );
  const messages = messagesPerDay.reduce((sum, d) => sum + d.count, 0);

  return {
    minimumBucket: 5,
    totals: {
      likes,
      mutualMatches,
      chats,
      messages,
    },
    likesPerDay,
    chatsPerDay,
    messagesPerDay,
    messagesByTypePerDay,
  };
}
