import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { GET as getEngagementInsights } from "../app/api/insights/engagement/route";
import { computeEngagementSummary } from "../components/insights/engagement/engagement-summary";
import {
  engagementInsightsQuery,
  readEngagementInsights,
} from "../lib/insights/engagement";
import { buildDevMockEngagementInsights } from "../lib/insights/mock-engagement";
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
    totals: {
      likes: 180,
      mutualMatches: 54,
      chats: 48,
      messages: 420,
    },
    likesPerDay: [
      { date: "2026-11-02", count: 40 },
      { date: "2026-11-01", count: 32 },
    ],
    chatsPerDay: [
      { date: "2026-11-02", count: 14 },
      { date: "2026-11-01", count: 10 },
    ],
    messagesPerDay: [
      { date: "2026-11-02", count: 120 },
      { date: "2026-11-01", count: 95 },
    ],
    messagesByTypePerDay: [
      { date: "2026-11-02", text: 100, image: 16 },
      { date: "2026-11-01", text: 80, image: 12 },
    ],
    ...overrides,
  };
}

test("engagement query keeps shared filters and strips PII parameters", () => {
  const parsed = engagementInsightsQuery(
    new URLSearchParams({
      from: "2026-11-01",
      to: "2026-11-14",
      faculty: "engineering",
      year: "2",
      gender: "female",
      relationshipGoal: "long-term-partner",
      onboarded: "onboarded",
      paused: "active",
      interest: "food-coffee",
      senderId: "user-123",
      content: "hello",
      email: "student@student.chula.ac.th",
    }),
  );

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const query = new URLSearchParams(parsed.query);
  assert.equal(query.get("faculty"), "engineering");
  assert.equal(query.get("year"), "2");
  assert.equal(query.get("gender"), "female");
  assert.equal(query.get("relationshipGoal"), "long-term-partner");
  assert.equal(query.get("onboarded"), "onboarded");
  assert.equal(query.get("paused"), "active");
  assert.equal(query.get("interest"), "food-coffee");
  assert.equal(query.get("senderId"), null);
  assert.equal(query.get("content"), null);
  assert.equal(query.get("email"), null);
});

test("readEngagementInsights enforces k >= 5 across totals, daily series, and message types", () => {
  const parsed = readEngagementInsights(
    makeValidPayload({
      totals: {
        likes: 180,
        mutualMatches: 54,
        chats: 4,
        messages: 3,
      },
      likesPerDay: [
        { date: "2026-11-02", count: 40 },
        { date: "2026-11-01", count: 4 },
      ],
      chatsPerDay: [
        { date: "2026-11-02", count: 6 },
        { date: "2026-11-01", count: 2 },
      ],
      messagesPerDay: [
        { date: "2026-11-02", count: 120 },
        { date: "2026-11-01", count: 4 },
      ],
      // Hide 2026-11-01 because image < 5 (even though text >= 5) so subtraction
      // against messagesPerDay cannot leak small image counts.
      messagesByTypePerDay: [
        { date: "2026-11-02", text: 100, image: 16 },
        { date: "2026-11-01", text: 14, image: 3 },
      ],
    }),
  );

  assert.ok(parsed);
  assert.deepEqual(parsed.totals, {
    likes: 180,
    mutualMatches: 54,
    chats: null,
    messages: null,
  });
  assert.deepEqual(parsed.likesPerDay, [{ date: "2026-11-02", count: 40 }]);
  assert.deepEqual(parsed.chatsPerDay, [{ date: "2026-11-02", count: 6 }]);
  assert.deepEqual(parsed.messagesPerDay, [{ date: "2026-11-02", count: 120 }]);
  assert.deepEqual(parsed.messagesByTypePerDay, [
    { date: "2026-11-02", text: 100, image: 16 },
  ]);
});

test("readEngagementInsights strips unknown PII fields and rejects invalid shapes", () => {
  const dirty = makeValidPayload({
    messages: [{ content: "secret", sender_id: "u1" }],
    extraPii: "alice@student.chula.ac.th",
    likesPerDay: [
      { date: "2026-11-01", count: 12, senderId: "u-secret", content: "hi" },
    ],
  });

  const sanitized = readEngagementInsights(dirty);
  assert.ok(sanitized);
  const json = JSON.stringify(sanitized);
  for (const forbidden of [
    "secret",
    "sender",
    "content",
    "alice",
    "extraPii",
    "u-secret",
  ]) {
    assert.equal(json.includes(forbidden), false, `Found leaked ${forbidden}`);
  }

  assert.equal(
    readEngagementInsights(makeValidPayload({ minimumBucket: 3 })),
    null,
  );
  assert.equal(readEngagementInsights(makeValidPayload({ totals: null })), null);
  assert.equal(
    readEngagementInsights(
      makeValidPayload({
        totals: { likes: 10, mutualMatches: -1, chats: 5, messages: 10 },
      }),
    ),
    null,
  );
  assert.equal(
    readEngagementInsights(
      makeValidPayload({
        messagesByTypePerDay: [{ date: "2026-11-01", text: 10, image: "bad" }],
      }),
    ),
    null,
  );
});

test("readEngagementInsights merges duplicate message-type dates before k >= 5 filter", () => {
  const merged = readEngagementInsights(
    makeValidPayload({
      messagesByTypePerDay: [
        { date: "2026-11-01", text: 3, image: 3 },
        { date: "2026-11-01", text: 2, image: 2 },
        { date: "2026-11-02", text: 6, image: 4 },
      ],
    }),
  );
  assert.ok(merged);
  assert.deepEqual(merged.messagesByTypePerDay, [
    { date: "2026-11-01", text: 5, image: 5 },
  ]);
});

test("computeEngagementSummary calculates rates client-side and guards <5 complement", () => {
  const safeInsights = readEngagementInsights(makeValidPayload());
  assert.ok(safeInsights);
  const summary = computeEngagementSummary(safeInsights);
  assert.equal(summary.mutualMatchRatePct, 30);
  assert.equal(summary.avgMessagesPerChat, 8.75);
  assert.equal(summary.oneWayLikesCount, 126);
  assert.equal(summary.typeTextTotal, 180);
  assert.equal(summary.typeImageTotal, 28);
  assert.equal(summary.typeMeasuredTotal, 208);

  // When likes - mutualMatches is between 1 and 4, do not expose complement.
  const narrowResidual = readEngagementInsights(
    makeValidPayload({
      totals: { likes: 52, mutualMatches: 50, chats: 45, messages: 200 },
    }),
  );
  assert.ok(narrowResidual);
  const residualSummary = computeEngagementSummary(narrowResidual);
  assert.equal(residualSummary.oneWayLikesCount, null);

  // Suppressed or zero denominators yield null rates rather than Infinity or NaN.
  const suppressedTotals = readEngagementInsights(
    makeValidPayload({
      totals: { likes: null, mutualMatches: 12, chats: 0, messages: 40 },
    }),
  );
  assert.ok(suppressedTotals);
  const suppressedSummary = computeEngagementSummary(suppressedTotals);
  assert.equal(suppressedSummary.mutualMatchRatePct, null);
  assert.equal(suppressedSummary.avgMessagesPerChat, null);
  assert.equal(suppressedSummary.oneWayLikesCount, null);
});

async function withEngagementSession(
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

test("GET /api/insights/engagement requires staff auth and proxies sanitized query", async () => {
  const unauthed = await getEngagementInsights(
    new NextRequest(
      "http://localhost:8082/api/insights/engagement?from=2026-11-01&to=2026-11-14",
    ),
  );
  assert.equal(unauthed.status, 401);

  await withEngagementSession(
    "http://localhost:8082/api/insights/engagement?from=2026-11-01&to=2026-11-14&faculty=engineering&senderId=secret",
    async (request) => {
      globalThis.fetch = async (input, init) => {
        assert.equal(
          String(input),
          "http://cupid-backend.test/api/insights/engagement?from=2026-11-01&to=2026-11-14&faculty=engineering",
        );
        assert.equal(init?.redirect, "error");
        return new Response(JSON.stringify(makeValidPayload()));
      };
      const response = await getEngagementInsights(request);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.minimumBucket, 5);
      assert.equal(body.totals.mutualMatches, 54);
    },
    "http://cupid-backend.test/api",
  );
});

test("dev mock engagement data works outside production and is blocked in production", async () => {
  const env = process.env as Record<string, string | undefined>;
  const prevNodeEnv = env.NODE_ENV;
  try {
    env.NODE_ENV = "production";
    assert.equal(
      buildDevMockEngagementInsights("from=2026-11-01&to=2026-11-14"),
      null,
    );

    await withEngagementSession(
      "http://localhost:8082/api/insights/engagement?from=2026-11-01&to=2026-11-14&mock=1",
      async (request) => {
        const response = await getEngagementInsights(request);
        assert.equal(response.status, 503);
      },
      "",
    );

    env.NODE_ENV = "test";
    await withEngagementSession(
      "http://localhost:8082/api/insights/engagement?from=2026-11-01&to=2026-11-14&mock=1",
      async (request) => {
        const response = await getEngagementInsights(request);
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.minimumBucket, 5);
        assert.ok(body.likesPerDay.length > 0);
        assert.ok(body.chatsPerDay.length > 0);
        assert.ok(body.messagesPerDay.length > 0);
        assert.ok(body.messagesByTypePerDay.length > 0);
      },
      "",
    );

    const thirtyDays = buildDevMockEngagementInsights(
      "from=2026-10-16&to=2026-11-14",
    );
    assert.ok(thirtyDays);
    assert.equal(thirtyDays.likesPerDay.length, 30);
  } finally {
    env.NODE_ENV = prevNodeEnv;
  }
});
