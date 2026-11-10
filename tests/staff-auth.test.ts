import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { POST as googleSignIn } from "../app/api/auth/google/route";
import { GET as readSession } from "../app/api/auth/session/route";
import { POST as signOut } from "../app/api/auth/sign-out/route";
import { authResponse, setSessionCookie } from "../lib/server/auth-response";
import {
  createStaffSession,
  getStaffConfig,
  STAFF_SESSION_COOKIE,
  StaffAccessDenied,
  verifyGoogleCredential,
  verifyStaffSession,
  type StaffConfig,
} from "../lib/server/staff-auth";

const environmentKeys = [
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "STAFF_EMAILS",
  "STAFF_SESSION_SECRET",
  "NODE_ENV",
] as const;
const previousEnvironment = new Map(
  environmentKeys.map((key) => [key, process.env[key]]),
);
const testSecret =
  "test-only-staff-session-key-with-at-least-sixty-four-bytes-123456789";
const identity = { email: "staff@example.com", subject: "google-user-123" };

before(() => {
  Object.assign(process.env, {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "test-web-client",
    STAFF_EMAILS: " Staff@Example.com , , other@example.com",
    STAFF_SESSION_SECRET: testSecret,
  });
});
after(() => {
  for (const [key, value] of previousEnvironment) {
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else Object.assign(process.env, { [key]: value });
  }
});

test("server config normalizes the allowlist and refuses missing secrets", () => {
  const config = getStaffConfig();
  assert.deepEqual(
    [...config.emails],
    ["staff@example.com", "other@example.com"],
  );
  process.env.STAFF_SESSION_SECRET = "too-short";
  try {
    assert.throws(() => getStaffConfig());
  } finally {
    process.env.STAFF_SESSION_SECRET = testSecret;
  }
});

test("Google credentials require a valid signature, claims, and exact allowed email", async (t) => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const key = { ...(await exportJWK(publicKey)), kid: "test-google-key" };
  const keys = createLocalJWKSet({ keys: [key] });
  const config = getStaffConfig();
  const cases: {
    name: string;
    change?: Record<string, unknown>;
    omit?: string;
    allowed?: boolean;
  }[] = [
    { name: "allowed verified Google account", allowed: true },
    {
      name: "normalized email",
      change: { email: " Staff@Example.COM " },
      allowed: true,
    },
    {
      name: "alternate Google issuer",
      change: { iss: "accounts.google.com" },
      allowed: true,
    },
    { name: "different email", change: { email: "unknown@example.com" } },
    { name: "wrong issuer", change: { iss: "https://attacker.example" } },
    { name: "wrong audience", change: { aud: "another-client" } },
    {
      name: "expired token",
      change: { exp: Math.floor(Date.now() / 1000) - 60 },
    },
    { name: "missing expiry", omit: "exp" },
    { name: "missing subject", omit: "sub" },
    { name: "empty subject", change: { sub: "" } },
    { name: "unverified email", change: { email_verified: false } },
    {
      name: "verification is not a boolean",
      change: { email_verified: "true" },
    },
    { name: "missing email", omit: "email" },
  ];
  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const claims: Record<string, unknown> = {
        iss: "https://accounts.google.com",
        aud: config.clientId,
        sub: identity.subject,
        email: identity.email,
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...scenario.change,
      };
      if (scenario.omit) Reflect.deleteProperty(claims, scenario.omit);
      const token = await new SignJWT(claims)
        .setProtectedHeader({ alg: "RS256", kid: key.kid })
        .sign(privateKey);
      if (scenario.allowed)
        assert.deepEqual(
          await verifyGoogleCredential(token, config, keys),
          identity,
        );
      else await assert.rejects(verifyGoogleCredential(token, config, keys));
    });
  }
  const otherKeys = await generateKeyPair("RS256");
  const badSignature = await new SignJWT({
    email: identity.email,
    email_verified: true,
  })
    .setProtectedHeader({ alg: "RS256", kid: key.kid })
    .setIssuer("https://accounts.google.com")
    .setAudience(config.clientId)
    .setSubject(identity.subject)
    .setExpirationTime("1h")
    .sign(otherKeys.privateKey);
  await assert.rejects(verifyGoogleCredential(badSignature, config, keys));
});

test("staff sessions cannot survive removal from the allowlist or an empty list", async () => {
  const config = getStaffConfig();
  const token = await createStaffSession(identity, config);
  assert.deepEqual(await verifyStaffSession(token, config), identity);
  await assert.rejects(
    verifyStaffSession(token, { ...config, emails: new Set() }),
    StaffAccessDenied,
  );
  await assert.rejects(
    createStaffSession(identity, { ...config, emails: new Set() }),
    StaffAccessDenied,
  );
  await assert.rejects(
    verifyStaffSession(token, {
      ...config,
      secret: new TextEncoder().encode(
        "a different session signing key with 32 bytes",
      ),
    }),
  );
});

test("staff sessions reject expired, malformed, wrongly issued, and indefinite tokens", async () => {
  const config: StaffConfig = getStaffConfig();
  const cases = [
    { exp: Math.floor(Date.now() / 1000) - 60 },
    { exp: undefined },
    { iss: "cupid-2.0-backend" },
    { aud: "dating-app" },
    { sub: "" },
    { email: "" },
    { iat: undefined },
  ];
  for (const change of cases) {
    const token = await new SignJWT({
      iss: "cupid-dashboard",
      aud: "cupid-dashboard-staff",
      sub: identity.subject,
      email: identity.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...change,
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(config.secret);
    await assert.rejects(verifyStaffSession(token, config));
  }
  await assert.rejects(verifyStaffSession("not.a.valid-token", config));
});

test("session endpoint restores valid cookies and clears revoked sessions", async () => {
  const token = await createStaffSession(identity, getStaffConfig());
  const request = () =>
    new NextRequest("http://localhost:8082/api/auth/session", {
      headers: { Cookie: `${STAFF_SESSION_COOKIE}=${token}` },
    });
  const response = await readSession(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { email: identity.email });
  const oldEmails = process.env.STAFF_EMAILS;
  process.env.STAFF_EMAILS = "";
  try {
    const revoked = await readSession(request());
    assert.equal(revoked.status, 403);
    assert.match(revoked.headers.get("Set-Cookie") ?? "", /Max-Age=0/i);
  } finally {
    process.env.STAFF_EMAILS = oldEmails;
  }
});

test("session endpoint rejects missing and tampered cookies", async () => {
  assert.equal(
    (
      await readSession(
        new NextRequest("http://localhost:8082/api/auth/session"),
      )
    ).status,
    401,
  );
  const response = await readSession(
    new NextRequest("http://localhost:8082/api/auth/session", {
      headers: { Cookie: `${STAFF_SESSION_COOKIE}=invalid-token` },
    }),
  );
  assert.equal(response.status, 401);
  assert.match(response.headers.get("Set-Cookie") ?? "", /Max-Age=0/i);
});

test("auth POST endpoints reject other origins and sign-out expires the cookie", async () => {
  for (const handler of [googleSignIn, signOut]) {
    const response = await handler(
      new Request("http://localhost:8082/api/auth/test", {
        method: "POST",
        headers: { Origin: "https://attacker.example" },
      }),
    );
    assert.equal(response.status, 403);
  }
  const response = await signOut(
    new Request("http://localhost:8082/api/auth/sign-out", {
      method: "POST",
      headers: { Origin: "http://localhost:8082" },
    }),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Set-Cookie") ?? "", /Max-Age=0/i);
});

test("Google sign-in validates input without calling a product backend", async () => {
  const request = (body: string) =>
    new Request("http://localhost:8082/api/auth/google", {
      method: "POST",
      headers: {
        Origin: "http://localhost:8082",
        "Content-Type": "application/json",
      },
      body,
    });
  assert.equal((await googleSignIn(request("not json"))).status, 400);
  assert.equal(
    (await googleSignIn(request(JSON.stringify({ credential: "not-a-token" }))))
      .status,
    401,
  );
});

test("production session cookies are HttpOnly, Secure, scoped, and time-limited", () => {
  const previousMode = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    const response = setSessionCookie(
      authResponse({ email: identity.email }),
      "session-value",
    );
    const cookie = response.headers.get("Set-Cookie") ?? "";
    for (const attribute of [
      "HttpOnly",
      "Secure",
      "SameSite=lax",
      "Path=/",
      "Max-Age=3600",
    ])
      assert.ok(cookie.includes(attribute));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally {
    if (previousMode === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previousMode });
  }
});
