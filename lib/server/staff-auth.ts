import "server-only";

import {
  createRemoteJWKSet,
  jwtVerify,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";

export const STAFF_SESSION_COOKIE = "cupid.staff.session";
export const STAFF_SESSION_SECONDS = 60 * 60;
const SESSION_ISSUER = "cupid-dashboard";
const SESSION_AUDIENCE = "cupid-dashboard-staff";
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export type StaffConfig = {
  clientId: string;
  emails: Set<string>;
  secret: Uint8Array;
};

export type StaffIdentity = { email: string; subject: string };

export class StaffAccessDenied extends Error {}

export function getStaffConfig(): StaffConfig {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const secret = new TextEncoder().encode(
    process.env.STAFF_SESSION_SECRET ?? "",
  );
  if (!clientId || secret.length < 32) {
    throw new Error("Staff sign-in is not configured");
  }
  const emails = new Set(
    (process.env.STAFF_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
  return { clientId, emails, secret };
}

function allowedIdentity(
  email: unknown,
  subject: unknown,
  config: StaffConfig,
): StaffIdentity {
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof subject !== "string" ||
    !subject.trim()
  ) {
    throw new Error("Invalid staff identity");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!config.emails.has(normalizedEmail)) throw new StaffAccessDenied();
  return { email: normalizedEmail, subject };
}

export async function verifyGoogleCredential(
  credential: string,
  config: StaffConfig,
  keys: JWTVerifyGetKey = googleKeys,
): Promise<StaffIdentity> {
  const { payload } = await jwtVerify(credential, keys, {
    algorithms: ["RS256"],
    issuer: ["accounts.google.com", "https://accounts.google.com"],
    audience: config.clientId,
    requiredClaims: ["exp", "sub", "email", "email_verified"],
  });
  if (payload.email_verified !== true)
    throw new Error("Unverified Google email");
  return allowedIdentity(payload.email, payload.sub, config);
}

export async function createStaffSession(
  identity: StaffIdentity,
  config: StaffConfig,
): Promise<string> {
  const staff = allowedIdentity(identity.email, identity.subject, config);
  return new SignJWT({ email: staff.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(staff.subject)
    .setIssuedAt()
    .setExpirationTime(`${STAFF_SESSION_SECONDS}s`)
    .sign(config.secret);
}

export async function verifyStaffSession(
  token: string,
  config: StaffConfig,
): Promise<StaffIdentity> {
  const { payload } = await jwtVerify(token, config.secret, {
    algorithms: ["HS256"],
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
    requiredClaims: ["exp", "iat", "sub", "email"],
  });
  return allowedIdentity(payload.email, payload.sub, config);
}
