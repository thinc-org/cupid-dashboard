export type InsightsFilters = {
  from: string;
  to: string;
  faculty: string;
  year: string;
  gender: string;
  relationshipGoal: string;
  onboarded: string;
  paused: string;
  interest: string;
};

export type DatePreset = "7d" | "14d" | "30d" | "semester";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validYears = new Set(["1", "2", "3", "4", "5", "6"]);
const validGenders = new Set(["female", "male", "non-binary", "other"]);
const validRelationshipGoals = new Set([
  "long-term-partner",
  "long-term-but-casual-ok",
  "casual-but-long-term-ok",
  "casual-fun",
  "new-friends",
  "still-figuring-it-out",
]);
const validOnboarded = new Set(["onboarded", "not-onboarded"]);
const validPaused = new Set(["paused", "active"]);

export function parseInsightsFilterQuery(
  params: URLSearchParams,
): { ok: true; query: string } | { ok: false; message: string } {
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? "";
  if (!isCalendarDate(from)) {
    return { ok: false, message: "from must be a date in YYYY-MM-DD" };
  }
  if (!isCalendarDate(to)) {
    return { ok: false, message: "to must be a date in YYYY-MM-DD" };
  }
  if (from > to) return { ok: false, message: "from must be on or before to" };

  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  const days = Math.round((toTime - fromTime) / 86_400_000) + 1;
  if (days > 366) {
    return { ok: false, message: "date range cannot exceed 366 days" };
  }

  const query = new URLSearchParams({ from, to });
  const faculty = optionalText(params.get("faculty"), 80);
  if (typeof faculty !== "string") {
    return { ok: false, message: "faculty is too long" };
  }
  if (faculty) query.set("faculty", faculty);

  const year = params.get("year")?.trim() ?? "";
  if (year && !validYears.has(year)) {
    return { ok: false, message: "year must be from 1 to 6" };
  }
  if (year) query.set("year", year);

  const gender = choice(params.get("gender"), validGenders, "gender");
  if (!gender.ok) return gender;
  if (gender.value) query.set("gender", gender.value);

  const relationshipGoal = choice(
    params.get("relationshipGoal"),
    validRelationshipGoals,
    "relationshipGoal",
  );
  if (!relationshipGoal.ok) return relationshipGoal;
  if (relationshipGoal.value) {
    query.set("relationshipGoal", relationshipGoal.value);
  }

  const onboarded = choice(
    params.get("onboarded"),
    validOnboarded,
    "onboarded",
  );
  if (!onboarded.ok) return onboarded;
  if (onboarded.value) query.set("onboarded", onboarded.value);

  const paused = choice(params.get("paused"), validPaused, "paused");
  if (!paused.ok) return paused;
  if (paused.value) query.set("paused", paused.value);

  const interest = optionalText(params.get("interest"), 64);
  if (typeof interest !== "string") {
    return { ok: false, message: "interest is too long" };
  }
  if (interest.includes(",")) {
    return { ok: false, message: "interest must be a single tag" };
  }
  if (interest) query.set("interest", interest);

  return { ok: true, query: query.toString() };
}

export function buildInsightsQueryString(filters: InsightsFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export function bangkokToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildPresetRange(
  preset: DatePreset,
  today = bangkokToday(),
): { from: string; to: string } {
  switch (preset) {
    case "7d":
      return { from: shiftIsoDate(today, -6), to: today };
    case "14d":
      return { from: shiftIsoDate(today, -13), to: today };
    case "30d":
      return { from: shiftIsoDate(today, -29), to: today };
    case "semester": {
      const year = Number(today.slice(0, 4));
      const month = Number(today.slice(5, 7));
      // Chulalongkorn semester calendar: Sem 1 (Aug–Dec), Sem 2 (Jan–May), Summer (Jun–Jul)
      const from =
        month >= 8
          ? `${year}-08-01`
          : month >= 6
            ? `${year}-06-01`
            : `${year}-01-01`;
      return { from: from > today ? today : from, to: today };
    }
  }
}

export function defaultInsightsFilters(today = bangkokToday()): InsightsFilters {
  const range = buildPresetRange("14d", today);
  return {
    from: range.from,
    to: range.to,
    faculty: "",
    year: "",
    gender: "",
    relationshipGoal: "",
    onboarded: "",
    paused: "",
    interest: "",
  };
}

export function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function optionalText(value: string | null, maxLength: number): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

function choice(
  value: string | null,
  allowed: Set<string>,
  name: string,
): { ok: true; value: string } | { ok: false; message: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { ok: true, value: "" };
  if (!allowed.has(trimmed)) {
    return { ok: false, message: `${name} is not a known value` };
  }
  return { ok: true, value: trimmed };
}
