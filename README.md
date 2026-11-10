# CUpid Dashboard

Staff dashboard for CUpid, built with Next.js, with Google sign-in and email-based access control.

This repository contains the dashboard web app and its server-side authentication. Google sign-in, the email allowlist, and staff sessions run in Next.js on Vercel. Login does not call or change the production backend in [thinc-org/cupid-2.0](https://github.com/thinc-org/cupid-2.0). Charts and product-data APIs are not implemented yet.

## Local development

Use Node.js 22.16 or newer and pnpm 10.14.0, as specified in `package.json`.

```powershell
pnpm install --frozen-lockfile
```

Create `.env.local` from `.env.example` if you do not already have a local `.env` file:

```powershell
Copy-Item .env.example .env.local
```

Configure the public Google client ID and two server-only values:

```dotenv
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
STAFF_EMAILS=alice@gmail.com,bob@example.com
STAFF_SESSION_SECRET=REPLACE_WITH_A_RANDOM_SECRET
```

Generate a dedicated session secret of at least 32 bytes:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Store the generated value in the ignored local environment file. Use different secrets for local development, Preview, and Production. `STAFF_EMAILS` is a comma-separated list of permitted Google email addresses; an empty list denies everyone. Neither server-only value uses the `NEXT_PUBLIC_` prefix.

In Google Cloud, add `http://localhost` and `http://localhost:8082` to the web client's Authorized JavaScript origins. Run:

```powershell
pnpm dev
```

Open [http://localhost:8082](http://localhost:8082). Restart Next.js after changing environment variables. A CUpid backend or database is not required to test dashboard login.

## Authentication

The browser sends a Google ID token to `POST /api/auth/google` on the dashboard's own origin. The server verifies Google's signature, issuer, audience, expiry, verified email, and the staff allowlist. It creates a dedicated one-hour signed session in an HttpOnly, SameSite=Lax cookie, with Secure enabled in production. The session token is not returned in JSON or stored in browser session storage.

`GET /api/auth/session` checks the session signature, expiry, and current allowlist. `POST /api/auth/sign-out` clears the cookie. The POST endpoints reject requests from other origins, and auth responses use `Cache-Control: no-store`. Sessions expire without refresh; signing in again starts a new session. Sign-out clears this browser's cookie; there is no server-side token revocation store.

To check the flow locally:

- Sign in with an allowlisted Google account and reload; the session should be restored.
- Sign out; the dashboard should return to the Google sign-in screen.
- Remove the account from `STAFF_EMAILS`, restart Next.js, and reload an existing signed-in session; access should be denied.
- Sign in with an account outside the allowlist; access should be denied.

## Checks

```powershell
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions runs these checks on pull requests and pushes to `main`. Auth tests use isolated signing keys and do not contact Google or a database. The dashboard does not import code or generated clients from the Expo frontend.

## Vercel

Import `thinc-org/cupid-dashboard`, select the Next.js framework, and use the repository root as the Root Directory. Git integration handles deployments; this repository's CI checks the app without deploying it.

Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `STAFF_EMAILS`, and `STAFF_SESSION_SECRET` for each Vercel environment. Add each deployed dashboard origin to the Google web client's Authorized JavaScript origins. Redeploy after changing environment variables, including the allowlist. Dashboard login does not require backend CORS changes or a backend release.

Only `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is exposed to the browser. Keep `STAFF_EMAILS` and `STAFF_SESSION_SECRET` in Vercel's server environment. Do not copy CUpid's JWT key or database credentials into this project. Local `.env` files, dependencies, and build output are ignored by Git.

Future product-data APIs must enforce staff authorization at the server that serves that data. A successful dashboard login alone does not authorize calls to CUpid's existing product API. Any new data integration needs its own explicit access boundary.
