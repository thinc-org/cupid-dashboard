import {
  AGE_BAND_KEYS,
  type AgeBandsInsights,
  type AudienceTotals,
  type BucketCount,
  type DailyCountPoint,
  type MatchFilterInsights,
  type OnboardedStatusCounts,
} from "./audience-types";
import { ROLLED_OTHER_KEY } from "./enums";
import { isCalendarDate, isCount, isFiniteNonNegative } from "./filters";

const allowedAgeBands = new Set<string>(AGE_BAND_KEYS);

type ReadBucketsOptions = {
  sortBy?: "count-desc" | "key-asc" | "age-order";
  allowedKeys?: Set<string>;
};

export function readTotals(
  raw: unknown,
  minimumBucket: number,
  onboardedStatus: OnboardedStatusCounts | null,
  options: { singleOnboardingFilter?: boolean } = {},
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

  const rawUsers = readOptionalMinCount(obj.users, minimumBucket);
  if (rawUsers === undefined) return null;
  const previousUsers = readOptionalMinCount(obj.previousUsers, minimumBucket);
  if (previousUsers === undefined) return null;

  // On unfiltered requests, suppress both current and previous totals whenever
  // the onboarded split is suppressed (<5 on either side) so differencing
  // against onboarded-only filters cannot expose the small cohort and the KPI
  // card never shows "Suppressed (<5)" alongside a previous-period total.
  const canExposeTotal =
    Boolean(options.singleOnboardingFilter) || onboardedStatus !== null;
  if (!canExposeTotal) {
    return { users: null, previousUsers: null };
  }

  const users = onboardedStatus
    ? (rawUsers ?? onboardedStatus.onboarded + onboardedStatus.notOnboarded)
    : rawUsers;

  return { users, previousUsers };
}

function readOptionalMinCount(
  value: unknown,
  minimumBucket: number,
): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (!isCount(value)) return undefined;
  return value >= minimumBucket ? value : null;
}

export function readDailySeries(
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

export function readPair<K1 extends string, K2 extends string>(
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

    if (
      key === ROLLED_OTHER_KEY ||
      (options.allowedKeys && !options.allowedKeys.has(key))
    ) {
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
    kept.sort((a, b) =>
      a.key.localeCompare(b.key, undefined, { numeric: true }),
    );
  } else {
    kept.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }

  if (rolledOther >= minimumBucket) {
    kept.push({ key: ROLLED_OTHER_KEY, count: rolledOther });
  }

  return kept;
}

export function readAgeBands(
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
    if (
      totalCount >= minimumBucket &&
      obj.medianAge >= 15 &&
      obj.medianAge <= 99
    ) {
      medianAge = Math.round(obj.medianAge * 10) / 10;
    }
  }

  return { buckets, medianAge };
}

export function readMatchFilters(
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
