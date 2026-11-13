import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { GET as getAudienceInsights } from "../app/api/insights/users/route";
import {
  audienceInsightsQuery,
  readAudienceInsights,
} from "../lib/insights/audience";
import { buildPresetRange } from "../lib/insights/filters";
import { buildDevMockAudienceInsights } from "../lib/insights/mock-audience";
import {
  createStaffSession,
  getStaffConfig,
  STAFF_SESSION_COOKIE,
} from "../lib/server/staff-auth";

const testSecret =
  "test-only-staff-session-key-with-at-least-sixty-four-bytes-123456789";

function makeValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    minimumBucket: 5,
    totals: { users: 120, previousUsers: 100 },
    signupsPerDay: [
      { date: "2026-11-02", count: 12 },
      { date: "2026-11-01", count: 9 },
    ],
    onboardedPerDay: [
      { date: "2026-11-02", count: 10 },
      { date: "2026-11-01", count: 7 },
    ],
    onboardedStatus: { onboarded: 100, notOnboarded: 20 },
    pausedStatus: { active: 108, paused: 12 },
    faculty: [
      { key: "engineering", count: 60 },
      { key: "arts", count: 40 },
    ],
    year: [
      { key: "2", count: 55 },
      { key: "1", count: 45 },
    ],
    gender: [
      { key: "female", count: 65 },
      { key: "male", count: 55 },
    ],
    relationshipGoal: [{ key: "long-term-partner", count: 70 }],
    ageBands: {
      buckets: [
        { key: "20-21", count: 60 },
        { key: "18-19", count: 40 },
      ],
      medianAge: 20.4,
    },
    interestTags: [{ key: "food-coffee", count: 52 }],
    valueTags: [{ key: "honesty-and-trust", count: 80 }],
    matchFilters: {
      faculties: [
        { key: "no-restriction", count: 80 },
        { key: "engineering", count: 20 },
      ],
      years: [{ key: "no-restriction", count: 75 }],
      genderInterest: [{ key: "female", count: 62 }],
      relationshipGoals: [{ key: "no-restriction", count: 72 }],
    },
    ...overrides,
  };
}

test("audience query keeps supported filters and strips PII parameters", () => {
  const parsed = audienceInsightsQuery(
    new URLSearchParams({
      from: "2026-11-01",
      to: "2026-11-14",
      faculty: "pharmaceutical Science",
      year: "2",
      gender: "non-binary",
      relationshipGoal: "long-term-partner",
      onboarded: "onboarded",
      paused: "paused",
      interest: "food-coffee",
      email: "student@student.chula.ac.th",
      name: "Alice",
      dateOfBirth: "2005-01-01",
    }),
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const query = new URLSearchParams(parsed.query);
  assert.equal(query.get("faculty"), "pharmaceutical Science");
  assert.equal(query.get("year"), "2");
  assert.equal(query.get("gender"), "non-binary");
  assert.equal(query.get("relationshipGoal"), "long-term-partner");
  assert.equal(query.get("onboarded"), "onboarded");
  assert.equal(query.get("paused"), "paused");
  assert.equal(query.get("interest"), "food-coffee");
  assert.equal(query.get("email"), null);
  assert.equal(query.get("name"), null);
  assert.equal(query.get("dateOfBirth"), null);
});

test("date presets calculate Bangkok windows within 366 days", () => {
  assert.deepEqual(buildPresetRange("7d", "2026-11-14"), {
    from: "2026-11-08",
    to: "2026-11-14",
  });
  assert.deepEqual(buildPresetRange("14d", "2026-11-14"), {
    from: "2026-11-01",
    to: "2026-11-14",
  });
  assert.deepEqual(buildPresetRange("30d", "2026-11-14"), {
    from: "2026-10-16",
    to: "2026-11-14",
  });
  assert.deepEqual(buildPresetRange("semester", "2026-11-14"), {
    from: "2026-08-01",
    to: "2026-11-14",
  });
  assert.deepEqual(buildPresetRange("semester", "2026-03-15"), {
    from: "2026-01-01",
    to: "2026-03-15",
  });
  assert.deepEqual(buildPresetRange("semester", "2026-06-20"), {
    from: "2026-06-01",
    to: "2026-06-20",
  });
});

test("audience insights enforce minimumBucket >= 5 and roll small buckets into other", () => {
  assert.equal(
    readAudienceInsights(makeValidPayload({ minimumBucket: 4 })),
    null,
  );

  const parsed = readAudienceInsights(
    makeValidPayload({
      signupsPerDay: [
        { date: "2026-11-03", count: 4 },
        { date: "2026-11-01", count: 8 },
      ],
      onboardedPerDay: [
        { date: "2026-11-03", count: 3 },
        { date: "2026-11-02", count: 6 },
      ],
      onboardedStatus: { onboarded: 50, notOnboarded: 4 },
      pausedStatus: { active: 4, paused: 10 },
      faculty: [
        { key: "engineering", count: 40 },
        { key: "medicine", count: 3 },
        { key: "dentistry", count: 2 },
      ],
      gender: [
        { key: "female", count: 30 },
        { key: "non-binary", count: 2 },
      ],
      ageBands: {
        buckets: [
          { key: "<18", count: 2 },
          { key: "18-19", count: 12 },
          { key: "24+", count: 3 },
        ],
        medianAge: 19.2,
      },
      matchFilters: {
        faculties: [
          { key: "no-restriction", count: 40 },
          { key: "law", count: 3 },
          { key: "nursing", count: 4 },
        ],
        years: [{ key: "no-restriction", count: 4 }],
        genderInterest: [{ key: "female", count: 25 }],
        relationshipGoals: [{ key: "no-restriction", count: 30 }],
      },
    }),
  );

  assert.ok(parsed);
  // Daily points < 5 dropped and sorted chronologically
  assert.deepEqual(parsed.signupsPerDay, [{ date: "2026-11-01", count: 8 }]);
  assert.deepEqual(parsed.onboardedPerDay, [{ date: "2026-11-02", count: 6 }]);
  // Binary cards hidden when either side < 5; totals.users suppressed to prevent differencing leaks
  assert.equal(parsed.onboardedStatus, null);
  assert.equal(parsed.totals.users, null);
  assert.equal(parsed.pausedStatus, null);
  // Faculty 3 + 2 = 5 -> rolled into "other"
  assert.deepEqual(parsed.faculty, [
    { key: "engineering", count: 40 },
    { key: "other", count: 5 },
  ]);
  // Gender small bucket = 2 (< 5) -> "other" suppressed
  assert.deepEqual(parsed.gender, [{ key: "female", count: 30 }]);
  // Age bands 2 + 3 = 5 -> "other" kept and ordered properly
  assert.deepEqual(parsed.ageBands.buckets, [
    { key: "18-19", count: 12 },
    { key: "other", count: 5 },
  ]);
  assert.equal(parsed.ageBands.medianAge, 19.2);
  // Match filters preserve no-restriction >= 5 and hide < 5
  assert.deepEqual(parsed.matchFilters.faculties, [
    { key: "no-restriction", count: 40 },
    { key: "other", count: 7 },
  ]);
  assert.deepEqual(parsed.matchFilters.years, []);
});

test("audience insights strip all PII and disallowed profile fields", () => {
  const dirty = makeValidPayload({
    email: "person@student.chula.ac.th",
    name: "Secret Name",
    bio: "hello",
    major: "Computer Engineering",
    highSchool: "Triam Udom",
    instagramUsername: "@secret",
    location: "Bangkok",
    prompts: [{ question: "q", answer: "a" }],
    dateOfBirth: "2004-05-12",
    height: 175,
    photoUrl: "https://cdn.example.com/p.jpg",
    faculty: [
      {
        key: "engineering",
        count: 25,
        email: "leak@example.com",
        userIds: ["u1"],
      },
    ],
    signupsPerDay: [
      {
        date: "2026-11-01",
        count: 10,
        emails: ["a@b.com"],
      },
    ],
  });

  const sanitized = readAudienceInsights(dirty);
  assert.ok(sanitized);
  const json = JSON.stringify(sanitized);
  for (const forbidden of [
    "email",
    "Secret Name",
    "bio",
    "Computer Engineering",
    "Triam Udom",
    "@secret",
    "Bangkok",
    "prompts",
    "2004-05-12",
    "175",
    "photoUrl",
    "userIds",
  ]) {
    assert.equal(json.includes(forbidden), false, `Found leaked ${forbidden}`);
  }
});

test("audience insights suppress medianAge when total age cohort is under 5", () => {
  const parsed = readAudienceInsights(
    makeValidPayload({
      ageBands: {
        buckets: [{ key: "20-21", count: 3 }],
        medianAge: 20.5,
      },
    }),
  );
  assert.ok(parsed);
  assert.deepEqual(parsed.ageBands.buckets, []);
  assert.equal(parsed.ageBands.medianAge, null);
});

async function withAudienceSession(
  url: string,
  run: (request: NextRequest) => Promise<void>,
  apiUrl = "http://cupid-backend.test",
) {
  const keys = [
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "STAFF_EMAILS",
    "STAFF_SESSION_SECRET",
    "CUPID_API_URL",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "test-web-client",
    STAFF_EMAILS: "staff@example.com",
    STAFF_SESSION_SECRET: testSecret,
    CUPID_API_URL: apiUrl,
  });
  try {
    const token = await createStaffSession(
      { email: "staff@example.com", subject: "test-user" },
      getStaffConfig(),
    );
    await run(
      new NextRequest(url, {
        headers: { Cookie: `${STAFF_SESSION_COOKIE}=${token}` },
      }),
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  }
}

test("GET /api/insights/users requires staff auth and proxies sanitized query", async () => {
  const unauthed = await getAudienceInsights(
    new NextRequest(
      "http://localhost:8082/api/insights/users?from=2026-11-01&to=2026-11-14",
    ),
  );
  assert.equal(unauthed.status, 401);

  await withAudienceSession(
    "http://localhost:8082/api/insights/users?from=2026-11-01&to=2026-11-14&faculty=engineering&email=leak@example.com",
    async (request) => {
      globalThis.fetch = async (input, init) => {
        assert.equal(
          String(input),
          "http://cupid-backend.test/api/insights/users?from=2026-11-01&to=2026-11-14&faculty=engineering",
        );
        assert.equal(init?.redirect, "error");
        return new Response(JSON.stringify(makeValidPayload()));
      };
      const response = await getAudienceInsights(request);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.minimumBucket, 5);
      assert.equal(body.faculty[0].key, "engineering");
    },
    "http://cupid-backend.test/api",
  );
});

test("dev mock audience data works outside production and is blocked in production", async () => {
  const env = process.env as Record<string, string | undefined>;
  const prevNodeEnv = env.NODE_ENV;
  try {
    env.NODE_ENV = "production";
    assert.equal(
      buildDevMockAudienceInsights("from=2026-11-01&to=2026-11-14"),
      null,
    );

    await withAudienceSession(
      "http://localhost:8082/api/insights/users?from=2026-11-01&to=2026-11-14&mock=1",
      async (request) => {
        const response = await getAudienceInsights(request);
        assert.equal(response.status, 503);
      },
      "",
    );

    env.NODE_ENV = "test";
    await withAudienceSession(
      "http://localhost:8082/api/insights/users?from=2026-11-01&to=2026-11-14&mock=1",
      async (request) => {
        const response = await getAudienceInsights(request);
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.minimumBucket, 5);
        assert.ok(body.signupsPerDay.length > 0);
        assert.ok(body.matchFilters.faculties.length > 0);
      },
      "",
    );
  } finally {
    env.NODE_ENV = prevNodeEnv;
  }
});
