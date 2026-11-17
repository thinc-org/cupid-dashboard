import type { DailyCountPoint } from "./audience-types";

export type EngagementTotals = {
  likes: number | null;
  mutualMatches: number | null;
  chats: number | null;
  messages: number | null;
};

export type DailyMessageTypePoint = {
  date: string;
  text: number;
  image: number;
};

export type EngagementInsights = {
  minimumBucket: number;
  totals: EngagementTotals;
  likesPerDay: DailyCountPoint[];
  chatsPerDay: DailyCountPoint[];
  messagesPerDay: DailyCountPoint[];
  messagesByTypePerDay: DailyMessageTypePoint[];
};
