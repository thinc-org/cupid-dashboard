import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { GET as getDailyDecks } from "../app/api/insights/daily-decks/route";
import {
  dailyDeckQuery,
  readDailyDeckInsights,
} from "../lib/insights/daily-decks";
import {
  createStaffSession,
  getStaffConfig,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_SECONDS,
} from "../lib/server/staff-auth";

const testSecret =
  "test-only-staff-session-key-with-at-least-sixty-four-bytes-123456789";

test("daily deck query keeps profile filters and drops anything else", () => {
  const parsed = dailyDeckQuery(
    new URLSearchParams({
      from: "2026-11-01",
      to: "2026-11-11",
      faculty: " engineering ",
      year: "3",
      gender: "female",
      relationshipGoal: "new-friends",
      onboarded: "onboarded",
      paused: "active",
      interest: "music",
      email: "person@example.com",
      candidateUserIds: "secret",
    }),
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const query = new URLSearchParams(parsed.query);
  assert.equal(query.get("faculty"), "engineering");
  assert.equal(query.get("year"), "3");
  assert.equal(query.get("interest"), "music");
  assert.equal(query.get("email"), null);
  assert.equal(query.get("candidateUserIds"), null);
});

test("daily deck query rejects an inverted range and more than one interest", () => {
  assert.equal(
    dailyDeckQuery(
      new URLSearchParams({ from: "2026-11-11", to: "2026-11-01" }),
    ).ok,
    false,
  );
  const interest = dailyDeckQuery(
    new URLSearchParams({
      from: "2026-11-01",
      to: "2026-11-01",
      interest: "music,film",
    }),
  );
  assert.equal(interest.ok, false);
  if (!interest.ok)
    assert.equal(interest.message, "interest must be a single tag");
});

test("daily deck query rejects impossible dates before contacting CUpid", () => {
  for (const date of ["2026-02-29", "2026-02-31", "2026-13-01", "2026-00-10"]) {
    assert.equal(
      dailyDeckQuery(new URLSearchParams({ from: date, to: "2027-01-01" })).ok,
      false,
      date,
    );
  }
  assert.equal(
    dailyDeckQuery(
      new URLSearchParams({ from: "2028-02-29", to: "2028-02-29" }),
    ).ok,
    true,
  );
});

test("insight responses enforce their bucket threshold and bounded completion counts", () => {
  const day = {
    date: "2026-11-02",
    decksGenerated: 5,
    totalCandidateSlots: 12,
    averageDeckSize: 2.4,
    completedDecks: 2,
    completionRate: 0.4,
  };
  assert.equal(readDailyDeckInsights({ minimumBucket: 10, days: [day] }), null);
  assert.equal(
    readDailyDeckInsights({
      minimumBucket: 5,
      days: [{ ...day, completedDecks: 6 }],
    }),
    null,
  );
  assert.equal(
    readDailyDeckInsights({
      minimumBucket: 5,
      days: [{ ...day, completionRate: 1.1 }],
    }),
    null,
  );
});

async function withInsightSession(
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
      new NextRequest(
        "http://localhost:8082/api/insights/daily-decks?from=2026-10-29&to=2026-11-11",
        {
          headers: { Cookie: `${STAFF_SESSION_COOKIE}=${token}` },
        },
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  }
}

test("missing upstream config explains the 503 without clearing a valid session", async () => {
  await withInsightSession(async (request) => {
    const response = await getDailyDecks(request);
    assert.equal(response.status, 503);
    assert.match((await response.json()).message, /CUPID_API_URL/);
    assert.equal(response.headers.get("Set-Cookie"), null);
  }, "");
});

test("backend config failure remains a 503 and does not sign staff out", async () => {
  await withInsightSession(async (request) => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ message: "staff insights are not configured" }),
        { status: 503 },
      );
    const response = await getDailyDecks(request);
    assert.equal(response.status, 503);
    assert.match(
      (await response.json()).message,
      /BACKEND_STAFF_SESSION_SECRET/,
    );
    assert.equal(response.headers.get("Set-Cookie"), null);
  });
});

test("backend auth mismatch keeps the already-verified dashboard session", async () => {
  await withInsightSession(async (request) => {
    globalThis.fetch = async () => new Response("{}", { status: 401 });
    const response = await getDailyDecks(request);
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("Set-Cookie"), null);
  });
});

test("upstream requests preserve a base path and do not follow redirects", async () => {
  await withInsightSession(async (request) => {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        String(input),
        "http://cupid-backend.test/api/insights/daily-decks?from=2026-10-29&to=2026-11-11",
      );
      assert.equal(init?.redirect, "error");
      return new Response(JSON.stringify({ minimumBucket: 5, days: [] }));
    };
    assert.equal((await getDailyDecks(request)).status, 200);
  }, "http://cupid-backend.test/api");
});

test("upstream timeouts return an actionable gateway timeout", async () => {
  await withInsightSession(async (request) => {
    globalThis.fetch = async () => {
      throw new DOMException("Timed out", "TimeoutError");
    };
    const response = await getDailyDecks(request);
    assert.equal(response.status, 504);
    assert.match((await response.json()).message, /timed out/i);
  });
});

test("insight responses keep counts and drop identity fields", () => {
  const insights = readDailyDeckInsights({
    minimumBucket: 5,
    candidateUserIds: ["6d0f0c1e-4d2a-4e4b-9c1a-1c0d0e0f0a0b"],
    email: "person@example.com",
    days: [
      {
        date: "2026-11-02",
        decksGenerated: 5,
        totalCandidateSlots: 12,
        averageDeckSize: 2.4,
        completedDecks: 2,
        completionRate: 0.4,
        candidateUserIds: ["6d0f0c1e-4d2a-4e4b-9c1a-1c0d0e0f0a0b"],
        userId: "person",
      },
    ],
  });
  assert.deepEqual(insights, {
    minimumBucket: 5,
    days: [
      {
        date: "2026-11-02",
        decksGenerated: 5,
        totalCandidateSlots: 12,
        averageDeckSize: 2.4,
        completedDecks: 2,
        completionRate: 0.4,
      },
    ],
  });
  assert.equal(
    readDailyDeckInsights({
      minimumBucket: 5,
      days: [
        {
          date: "2026-11-02",
          decksGenerated: 4,
          totalCandidateSlots: 8,
          averageDeckSize: 2,
          completedDecks: 1,
          completionRate: 0.25,
        },
      ],
    }),
    null,
  );
});

test("daily deck route requires a staff session and forwards only the sanitized query", async () => {
  const previous = {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    STAFF_EMAILS: process.env.STAFF_EMAILS,
    STAFF_SESSION_SECRET: process.env.STAFF_SESSION_SECRET,
    CUPID_API_URL: process.env.CUPID_API_URL,
  };
  Object.assign(process.env, {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "test-web-client",
    STAFF_EMAILS: "staff@example.com",
    STAFF_SESSION_SECRET: testSecret,
    CUPID_API_URL: "http://cupid-backend.test",
  });
  const unsigned = await getDailyDecks(
    new NextRequest(
      "http://localhost:8082/api/insights/daily-decks?from=2026-11-01&to=2026-11-02",
    ),
  );
  assert.equal(unsigned.status, 401);

  const token = await createStaffSession(
    { email: "staff@example.com", subject: "google-user-123" },
    getStaffConfig(),
  );
  let requested = "";
  let authorization = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input, init) => {
    requested = String(input);
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(
      JSON.stringify({
        minimumBucket: 5,
        days: [
          {
            date: "2026-11-02",
            decksGenerated: 6,
            totalCandidateSlots: 18,
            averageDeckSize: 3,
            completedDecks: 3,
            completionRate: 0.5,
            candidateUserIds: ["hidden"],
          },
        ],
        email: "person@example.com",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const response = await getDailyDecks(
      new NextRequest(
        "http://localhost:8082/api/insights/daily-decks?from=2026-11-01&to=2026-11-11&faculty=law&email=person@example.com",
        { headers: { Cookie: `${STAFF_SESSION_COOKIE}=${token}` } },
      ),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(
      requested,
      "http://cupid-backend.test/insights/daily-decks?from=2026-11-01&to=2026-11-11&faculty=law",
    );
    assert.equal(authorization, `Bearer ${token}`);
    assert.deepEqual(await response.json(), {
      minimumBucket: 5,
      days: [
        {
          date: "2026-11-02",
          decksGenerated: 6,
          totalCandidateSlots: 18,
          averageDeckSize: 3,
          completedDecks: 3,
          completionRate: 0.5,
        },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("upstream 403, 400 validation errors, and invalid 200 JSON map cleanly", async () => {
  await withInsightSession(async (request) => {
    globalThis.fetch = async () => new Response("{}", { status: 403 });
    const forbidden = await getDailyDecks(request);
    assert.equal(forbidden.status, 403);
    assert.match((await forbidden.json()).message, /does not have access/i);
    assert.equal(forbidden.headers.get("Set-Cookie"), null);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "from must be before to" }), {
        status: 400,
      });
    const badRequest = await getDailyDecks(request);
    assert.equal(badRequest.status, 400);
    assert.equal((await badRequest.json()).message, "from must be before to");

    globalThis.fetch = async () => new Response("not-json", { status: 200 });
    const invalidJson = await getDailyDecks(request);
    assert.equal(invalidJson.status, 502);
    assert.match(
      (await invalidJson.json()).message,
      /returned an unexpected response/i,
    );
  });
});

test("upstream 401 when dashboard session expired mid-request returns 401 and clears cookie", async (t) => {
  await withInsightSession(async (request) => {
    try {
      globalThis.fetch = async () => {
        t.mock.timers.enable({
          apis: ["Date"],
          now: Date.now() + (STAFF_SESSION_SECONDS + 10) * 1000,
        });
        return new Response("{}", { status: 401 });
      };
      const response = await getDailyDecks(request);
      assert.equal(response.status, 401);
      assert.match((await response.json()).message, /no longer valid/i);
      const setCookie = response.headers.get("Set-Cookie") ?? "";
      assert.match(setCookie, new RegExp(`${STAFF_SESSION_COOKIE}=`));
      assert.match(setCookie, /Max-Age=0/);
    } finally {
      t.mock.timers.reset();
    }
  });
});
