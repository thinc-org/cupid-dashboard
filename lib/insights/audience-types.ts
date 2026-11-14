import { ROLLED_OTHER_KEY } from "./enums";

export type DailyCountPoint = {
  date: string;
  count: number;
};

export type BucketCount = {
  key: string;
  count: number;
};

export type OnboardedStatusCounts = {
  onboarded: number;
  notOnboarded: number;
};

export type PausedStatusCounts = {
  active: number;
  paused: number;
};

export type AgeBandsInsights = {
  buckets: BucketCount[];
  medianAge: number | null;
};

export type MatchFilterInsights = {
  faculties: BucketCount[];
  years: BucketCount[];
  genderInterest: BucketCount[];
  relationshipGoals: BucketCount[];
};

export type AudienceTotals = {
  users: number | null;
  previousUsers: number | null;
};

export type AudienceInsights = {
  minimumBucket: number;
  totals: AudienceTotals;
  signupsPerDay: DailyCountPoint[];
  onboardedPerDay: DailyCountPoint[];
  onboardedStatus: OnboardedStatusCounts | null;
  pausedStatus: PausedStatusCounts | null;
  faculty: BucketCount[];
  year: BucketCount[];
  gender: BucketCount[];
  relationshipGoal: BucketCount[];
  ageBands: AgeBandsInsights;
  interestTags: BucketCount[];
  valueTags: BucketCount[];
  matchFilters: MatchFilterInsights;
};

export const AGE_BAND_KEYS = [
  "<18",
  "18-19",
  "20-21",
  "22-23",
  "24+",
  ROLLED_OTHER_KEY,
] as const;
