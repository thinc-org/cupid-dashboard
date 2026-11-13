import {
  isCalendarDate,
  isCount,
  isFiniteNonNegative,
  parseInsightsFilterQuery,
} from "./filters";

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
  "other",
] as const;

const allowedAgeBands = new Set<string>(AGE_BAND_KEYS);

export function audienceInsightsQuery(
  params: URLSearchParams,
): { ok: true; query: string } | { ok: false; message: string } {
  return parseInsightsFilterQuery(params);
}

export function readAudienceInsights(body: unknown): AudienceInsights | null {
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
  const year = readBuckets(record.year, minimumBucket, {
    sortBy: "key-asc",
  });
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

  const totals = readTotals(record.totals, minimumBucket, onboardedStatus);
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

function readTotals(
  raw: unknown,
  minimumBucket: number,
  onboardedStatus: OnboardedStatusCounts | null,
): AudienceTotals | null {
  if (raw === undefined || raw === null) {
    if (onboardedStatus) {
      return {
        users: onboardedStatus.onboarded + onboardedStatus.notOnboarded,
        previousUsers: null,
      };
    }
    return { users: null, previousUsers: null };
  }
  if (typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const users = readOptionalMinCount(obj.users, minimumBucket);
  if (users === undefined) return null;
  const previousUsers = readOptionalMinCount(obj.previousUsers, minimumBucket);
  if (previousUsers === undefined) return null;

  return {
    users:
      users ??
      (onboardedStatus
        ? onboardedStatus.onboarded + onboardedStatus.notOnboarded
        : null),
    previousUsers,
  };
}

function readOptionalMinCount(
  value: unknown,
  minimumBucket: number,
): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (!isCount(value)) return undefined;
  return value >= minimumBucket ? value : null;
}

function readDailySeries(
  raw: unknown,
  minimumBucket: number,
): DailyCountPoint[] | null {
  if (!Array.isArray(raw)) return null;

  const byDate = new Map<string, number>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.date !== "string" || !isCalendarDate(item.date)) {
      return null;
    }
    if (!isCount(item.count)) return null;
    byDate.set(item.date, (byDate.get(item.date) ?? 0) + item.count);
  }

  return Array.from(byDate.entries())
    .filter(([, count]) => count >= minimumBucket)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function readPair<K1 extends string, K2 extends string>(
  raw: unknown,
  firstKey: K1,
  secondKey: K2,
  minimumBucket: number,
): Record<K1 | K2, number> | null | undefined {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const first = obj[firstKey];
  const second = obj[secondKey];
  if (!isCount(first) || !isCount(second)) return undefined;
  if (first < minimumBucket || second < minimumBucket) return null;
  return { [firstKey]: first, [secondKey]: second } as Record<K1 | K2, number>;
}

type ReadBucketsOptions = {
  sortBy?: "count-desc" | "key-asc" | "age-order";
  allowedKeys?: Set<string>;
};

export function readBuckets(
  raw: unknown,
  minimumBucket: number,
  options: ReadBucketsOptions = {},
): BucketCount[] | null {
  if (!Array.isArray(raw)) return null;

  const totals = new Map<string, number>();
  let rolledOther = 0;

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.key !== "string") return null;
    const key = item.key.trim();
    if (!key || key.length > 100) return null;
    if (!isCount(item.count)) return null;

    if (options.allowedKeys && !options.allowedKeys.has(key)) {
      rolledOther += item.count;
      continue;
    }
    if (key === "other") {
      rolledOther += item.count;
      continue;
    }
    totals.set(key, (totals.get(key) ?? 0) + item.count);
  }

  const kept: BucketCount[] = [];
  for (const [key, count] of totals.entries()) {
    if (count < minimumBucket) {
      rolledOther += count;
    } else {
      kept.push({ key, count });
    }
  }

  if (options.sortBy === "age-order") {
    const order = new Map<string, number>(
      AGE_BAND_KEYS.map((key, index) => [key, index]),
    );
    kept.sort(
      (a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999),
    );
  } else if (options.sortBy === "key-asc") {
    kept.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  } else {
    kept.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }

  if (rolledOther >= minimumBucket) {
    kept.push({ key: "other", count: rolledOther });
  }

  return kept;
}

function readAgeBands(
  raw: unknown,
  minimumBucket: number,
): AgeBandsInsights | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const buckets = readBuckets(obj.buckets, minimumBucket, {
    sortBy: "age-order",
    allowedKeys: allowedAgeBands,
  });
  if (!buckets) return null;

  const totalCount = buckets.reduce((sum, item) => sum + item.count, 0);
  let medianAge: number | null = null;
  if (obj.medianAge !== undefined && obj.medianAge !== null) {
    if (!isFiniteNonNegative(obj.medianAge)) return null;
    if (totalCount >= minimumBucket && obj.medianAge >= 15 && obj.medianAge <= 99) {
      medianAge = Math.round(obj.medianAge * 10) / 10;
    }
  }

  return { buckets, medianAge };
}

function readMatchFilters(
  raw: unknown,
  minimumBucket: number,
): MatchFilterInsights | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const faculties = readBuckets(obj.faculties, minimumBucket);
  const years = readBuckets(obj.years, minimumBucket, { sortBy: "key-asc" });
  const genderInterest = readBuckets(obj.genderInterest, minimumBucket);
  const relationshipGoals = readBuckets(obj.relationshipGoals, minimumBucket);

  if (!faculties || !years || !genderInterest || !relationshipGoals) {
    return null;
  }

  return {
    faculties,
    years,
    genderInterest,
    relationshipGoals,
  };
}
