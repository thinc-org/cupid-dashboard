# CUpid Dashboard

Staff dashboard for CUpid, built with Next.js, with Google sign-in and email-based access control.

This repository contains the dashboard web app. The backend and `/staff/*` endpoints live in [thinc-org/cupid-2.0](https://github.com/thinc-org/cupid-2.0). Staff access is independent of dating-app accounts and the beta-tester list. Charts are not implemented yet.

## Local development

Use Node.js 22.16 or newer and pnpm 10.14.0, as specified in `package.json`.

```powershell
pnpm install --frozen-lockfile
```

Create `.env.local` from `.env.example` if you do not already have a local `.env` file:

```powershell
Copy-Item .env.example .env.local
```

Set these public build-time values:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

In the backend's environment, include the same Google web client ID in `BACKEND_ALLOWED_CLIENT_IDS`, add `http://localhost:8082` to `BACKEND_ALLOWED_ORIGINS`, and set `BACKEND_STAFF_EMAILS` to comma-separated permitted Google email addresses. An empty staff list denies everyone. Keep the backend connected to a local database for local development.

In Google Cloud, add `http://localhost` and `http://localhost:8082` to the web client's Authorized JavaScript origins. Then start the backend separately on port 3000 and run:

```powershell
pnpm dev
```

Open [http://localhost:8082](http://localhost:8082). Restart Next.js after changing environment variables, and restart the backend after updating its email allowlist.

## Authentication

The dashboard sends a Google ID token to `POST /staff/sign-in`. The backend validates the Google token and allowed email, then returns a separate staff token. The dashboard stores that token in the browser's session storage and checks it through `GET /staff/session` when the page loads. Every protected staff request must pass backend staff authentication and the configured email allowlist. Staff tokens expire without refresh; signing in again starts a new session.

To check the flow locally:

- Sign in with an allowlisted Google account and reload; the session should be restored.
- Sign out; the dashboard should return to the Google sign-in screen.
- Remove the account from the backend allowlist, restart the backend, and reload an existing signed-in session; access should be denied.
- Sign in with an account outside the allowlist; access should be denied.

## Checks

```powershell
pnpm typecheck
pnpm build
```

GitHub Actions runs both checks on pull requests and pushes to `main`. The dashboard does not import code or generated clients from the Expo frontend.

## Vercel

Import `thinc-org/cupid-dashboard`, select the Next.js framework, and use the repository root as the Root Directory. Git integration handles deployments; this repository's CI checks the app without deploying it.

Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for each Vercel environment. Add each deployed dashboard origin to the backend's `BACKEND_ALLOWED_ORIGINS` and to the Google web client's Authorized JavaScript origins. Redeploy after changing public build-time values.

`NEXT_PUBLIC_*` values are exposed to the browser. Database credentials, JWT signing keys, and the staff email allowlist belong only in the backend environment. Local `.env` files, dependencies, and build output are ignored by Git.
