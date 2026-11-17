import type { AudienceInsights, BucketCount } from "./audience";
import { shiftIsoDate } from "./filters";

export function buildDevMockAudienceInsights(queryString: string): AudienceInsights | null {
  if (process.env.NODE_ENV === "production") return null;

  const params = new URLSearchParams(queryString);
  const from = params.get("from") || "2026-11-01";
  const to = params.get("to") || "2026-11-14";

  // Scale mock counts down when cross-filters narrow the cohort so staff can
  // preview both normal distributions and < 5 bucket roll-ups.
  let filterCount = 0;
  for (const key of [
    "faculty",
    "year",
    "gender",
    "relationshipGoal",
    "onboarded",
    "paused",
    "interest",
  ]) {
    if (params.get(key)) filterCount += 1;
  }
  const scale = Math.max(0.18, 1 - filterCount * 0.22);
  const s = (n: number) => Math.max(1, Math.round(n * scale));

  const dayList = enumerateDates(from, to, 14);
  const signupsPerDay = dayList.map((date, idx) => ({
    date,
    count: s(14 + ((idx * 7) % 19)),
  }));
  const onboardedPerDay = dayList.map((date, idx) => ({
    date,
    count: s(10 + ((idx * 5) % 15)),
  }));

  const onboarded = params.get("onboarded");
  const paused = params.get("paused");

  const onboardedCount = onboarded === "not-onboarded" ? 0 : s(284);
  const notOnboardedCount = onboarded === "onboarded" ? 0 : s(48);
  const activeCount = paused === "paused" ? 0 : s(296);
  const pausedCount = paused === "active" ? 0 : s(36);

  const selectedFaculty = params.get("faculty");
  const faculty: BucketCount[] = selectedFaculty
    ? [{ key: selectedFaculty, count: s(92) }]
    : [
        { key: "engineering", count: s(88) },
        { key: "commerce-and-accountancy", count: s(64) },
        { key: "arts", count: s(51) },
        { key: "science", count: s(43) },
        { key: "communication-arts", count: s(32) },
        { key: "architecture", count: s(24) },
        { key: "economics", count: s(19) },
        { key: "medicine", count: s(4) },
        { key: "dentistry", count: s(3) },
      ];

  const selectedYear = params.get("year");
  const year: BucketCount[] = selectedYear
    ? [{ key: selectedYear, count: s(74) }]
    : [
        { key: "1", count: s(82) },
        { key: "2", count: s(96) },
        { key: "3", count: s(78) },
        { key: "4", count: s(54) },
        { key: "5", count: s(14) },
        { key: "6", count: s(4) },
      ];

  const selectedGender = params.get("gender");
  const gender: BucketCount[] = selectedGender
    ? [{ key: selectedGender, count: s(148) }]
    : [
        { key: "female", count: s(168) },
        { key: "male", count: s(142) },
        { key: "non-binary", count: s(14) },
        { key: "other", count: s(8) },
      ];

  const selectedGoal = params.get("relationshipGoal");
  const relationshipGoal: BucketCount[] = selectedGoal
    ? [{ key: selectedGoal, count: s(120) }]
    : [
        { key: "long-term-partner", count: s(124) },
        { key: "long-term-but-casual-ok", count: s(78) },
        { key: "new-friends", count: s(54) },
        { key: "still-figuring-it-out", count: s(42) },
        { key: "casual-but-long-term-ok", count: s(22) },
        { key: "casual-fun", count: s(12) },
      ];

  return {
    minimumBucket: 5,
    totals: {
      users: onboardedCount + notOnboardedCount,
      previousUsers: s(294),
    },
    signupsPerDay,
    onboardedPerDay,
    onboardedStatus: {
      onboarded: onboardedCount,
      notOnboarded: notOnboardedCount,
    },
    pausedStatus: {
      active: activeCount,
      paused: pausedCount,
    },
    faculty,
    year,
    gender,
    relationshipGoal,
    ageBands: {
      buckets: [
        { key: "<18", count: s(3) },
        { key: "18-19", count: s(112) },
        { key: "20-21", count: s(138) },
        { key: "22-23", count: s(64) },
        { key: "24+", count: s(15) },
      ],
      medianAge: 20.5,
    },
    interestTags: [
      { key: "food-coffee", count: s(136) },
      { key: "music-indie", count: s(114) },
      { key: "movies-netflix", count: s(98) },
      { key: "food-matcha", count: s(84) },
      { key: "sports-gym", count: s(76) },
      { key: "goingout-concerts", count: s(69) },
      { key: "stayingin-cozy", count: s(62) },
      { key: "pets-cats", count: s(55) },
      { key: "track-chill", count: s(48) },
      { key: "reading-manga", count: s(37) },
      { key: "creativity-photography", count: s(29) },
      { key: "sports-climbing", count: s(4) },
    ],
    valueTags: [
      { key: "honesty-and-trust", count: s(212) },
      { key: "meaningful-conversation", count: s(174) },
      { key: "emotional-support-and-empathy", count: s(158) },
      { key: "having-fun", count: s(131) },
      { key: "independence-and-balance", count: s(96) },
      { key: "self-growth", count: s(88) },
      { key: "physical-affection", count: s(49) },
    ],
    matchFilters: {
      faculties: [
        { key: "no-restriction", count: s(198) },
        { key: "engineering", count: s(52) },
        { key: "commerce-and-accountancy", count: s(39) },
        { key: "arts", count: s(31) },
        { key: "science", count: s(18) },
        { key: "medicine", count: s(3) },
      ],
      years: [
        { key: "no-restriction", count: s(112) },
        { key: "1", count: s(64) },
        { key: "2", count: s(118) },
        { key: "3", count: s(94) },
        { key: "4", count: s(58) },
        { key: "5", count: s(9) },
        { key: "6", count: s(2) },
      ],
      genderInterest: [
        { key: "female", count: s(156) },
        { key: "male", count: s(162) },
        { key: "non-binary", count: s(28) },
        { key: "no-restriction", count: s(14) },
        { key: "other", count: s(6) },
      ],
      relationshipGoals: [
        { key: "no-restriction", count: s(142) },
        { key: "long-term-partner", count: s(118) },
        { key: "long-term-but-casual-ok", count: s(64) },
        { key: "new-friends", count: s(38) },
        { key: "still-figuring-it-out", count: s(19) },
      ],
    },
  };
}

function enumerateDates(from: string, to: string, maxDays: number): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to && dates.length < maxDays) {
    dates.push(cursor);
    cursor = shiftIsoDate(cursor, 1);
  }
  return dates;
}
