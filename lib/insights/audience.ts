import {
  readAgeBands,
  readBuckets,
  readDailySeries,
  readMatchFilters,
  readPair,
  readTotals,
} from "./audience-readers";
import type { AudienceInsights } from "./audience-types";
import { parseInsightsFilterQuery } from "./filters";

export { readBuckets } from "./audience-readers";
export {
  AGE_BAND_KEYS,
  type AgeBandsInsights,
  type AudienceInsights,
  type AudienceTotals,
  type BucketCount,
  type DailyCountPoint,
  type MatchFilterInsights,
  type OnboardedStatusCounts,
  type PausedStatusCounts,
} from "./audience-types";

export type ReadAudienceOptions = {
  singleOnboardingFilter?: boolean;
};

export function hasSingleOnboardingFilter(query?: string): boolean {
  if (!query) return false;
  const onboarded = new URLSearchParams(query).get("onboarded");
  return onboarded === "onboarded" || onboarded === "not-onboarded";
}

export function audienceInsightsQuery(
  params: URLSearchParams,
): { ok: true; query: string } | { ok: false; message: string } {
  return parseInsightsFilterQuery(params);
}

export function readAudienceInsights(
  body: unknown,
  options: ReadAudienceOptions = {},
): AudienceInsights | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;

  if (
    !Number.isInteger(record.minimumBucket) ||
    Number(record.minimumBucket) < 5
  ) {
    return null;
  }
  const minimumBucket = Number(record.minimumBucket);

  const signupsPerDay = readDailySeries(record.signupsPerDay, minimumBucket);
  const onboardedPerDay = readDailySeries(
    record.onboardedPerDay,
    minimumBucket,
  );
  if (!signupsPerDay || !onboardedPerDay) return null;

  const onboardedStatus = readPair(
    record.onboardedStatus,
    "onboarded",
    "notOnboarded",
    minimumBucket,
  );
  if (onboardedStatus === undefined) return null;

  const pausedStatus = readPair(
    record.pausedStatus,
    "active",
    "paused",
    minimumBucket,
  );
  if (pausedStatus === undefined) return null;

  const faculty = readBuckets(record.faculty, minimumBucket);
  const year = readBuckets(record.year, minimumBucket, { sortBy: "key-asc" });
  const gender = readBuckets(record.gender, minimumBucket);
  const relationshipGoal = readBuckets(record.relationshipGoal, minimumBucket);
  const interestTags = readBuckets(record.interestTags, minimumBucket);
  const valueTags = readBuckets(record.valueTags, minimumBucket);

  if (
    !faculty ||
    !year ||
    !gender ||
    !relationshipGoal ||
    !interestTags ||
    !valueTags
  ) {
    return null;
  }

  const ageBands = readAgeBands(record.ageBands, minimumBucket);
  if (!ageBands) return null;

  const matchFilters = readMatchFilters(record.matchFilters, minimumBucket);
  if (!matchFilters) return null;

  const totals = readTotals(record.totals, minimumBucket, onboardedStatus, {
    singleOnboardingFilter: options.singleOnboardingFilter,
  });
  if (!totals) return null;

  return {
    minimumBucket,
    totals,
    signupsPerDay,
    onboardedPerDay,
    onboardedStatus,
    pausedStatus,
    faculty,
    year,
    gender,
    relationshipGoal,
    ageBands,
    interestTags,
    valueTags,
    matchFilters,
  };
}
