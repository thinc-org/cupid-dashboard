"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const STAFF_TOKEN_KEY = "cupid.staff.token";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential: string;
};

type SessionStatus = "checking" | "signed-out" | "signed-in";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const apiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";

const googleClientId = () =>
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

const readErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as { message?: string };
    return typeof body.message === "string" ? body.message : "";
  } catch {
    return "";
  }
};

const HomePage = () => {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);
  const signingInRef = useRef(false);
  const signInRef = useRef<(credential: string) => void>(() => {});

  const apiConfigured = Boolean(apiUrl());
  const googleConfigured = Boolean(googleClientId());

  signInRef.current = (credential: string) => {
    if (status !== "signed-out" || signingInRef.current) {
      return;
    }
    void (async () => {
      setError("");
      if (!apiConfigured) {
        setError("The API address is not configured.");
        return;
      }

      signingInRef.current = true;
      setSigningIn(true);
      try {
        const response = await fetch(`${apiUrl()}/staff/sign-in`, {
          method: "POST",
          headers: { Authorization: `Bearer ${credential}` },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          if (response.status === 403) {
            setError(
              "This Google account is not allowed to use the dashboard.",
            );
            return;
          }
          const message = await readErrorMessage(response);
          setError(message || "Google sign-in was rejected.");
          return;
        }

        const body = (await response.json()) as {
          token?: string;
          email?: string;
        };
        if (
          typeof body.token !== "string" ||
          !body.token ||
          typeof body.email !== "string" ||
          !body.email
        ) {
          setError("The API returned an invalid staff session.");
          return;
        }

        try {
          sessionStorage.setItem(STAFF_TOKEN_KEY, body.token);
        } catch {
          setError(
            "Allow browser session storage to sign in to the dashboard.",
          );
          return;
        }
        setEmail(body.email);
        setStatus("signed-in");
      } catch {
        setError("The dashboard could not reach the API.");
      } finally {
        signingInRef.current = false;
        setSigningIn(false);
      }
    })();
  };

  useEffect(() => {
    const base = apiUrl();
    let token: string | null;
    try {
      token = sessionStorage.getItem(STAFF_TOKEN_KEY);
    } catch {
      setError("Allow browser session storage to sign in to the dashboard.");
      setStatus("signed-out");
      return;
    }
    if (!base || !token) {
      setStatus("signed-out");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const restore = async () => {
      try {
        const response = await fetch(`${base}/staff/session`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem(STAFF_TOKEN_KEY);
          }
          setError(
            response.status === 403
              ? "This Google account is not allowed to use the dashboard."
              : response.status === 401
                ? "Your session is no longer valid. Please sign in again."
                : "The dashboard could not check your session. Please try again.",
          );
          setStatus("signed-out");
          return;
        }
        const body = (await response.json()) as { email?: string } | null;
        if (cancelled) {
          return;
        }
        if (typeof body?.email !== "string" || !body.email.trim()) {
          sessionStorage.removeItem(STAFF_TOKEN_KEY);
          setError(
            "The API returned an invalid staff session. Please sign in again.",
          );
          setStatus("signed-out");
          return;
        }
        setEmail(body.email);
        setStatus("signed-in");
      } catch {
        if (!cancelled) {
          setError("The dashboard could not reach the API.");
          setStatus("signed-out");
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    void restore();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (
      status !== "signed-out" ||
      !apiConfigured ||
      !googleConfigured ||
      !googleReady
    ) {
      return;
    }

    const parent = buttonRef.current;
    const clientId = googleClientId();
    if (!parent || !clientId) {
      return;
    }

    if (!window.google?.accounts.id) {
      return;
    }
    if (!googleInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (response) => {
          signInRef.current(response.credential);
        },
      });
      googleInitializedRef.current = true;
    }
    parent.replaceChildren();
    window.google.accounts.id.renderButton(parent, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280,
    });

    return () => {
      parent.replaceChildren();
    };
  }, [apiConfigured, googleConfigured, googleReady, status]);

  const signOut = () => {
    try {
      sessionStorage.removeItem(STAFF_TOKEN_KEY);
    } catch {
      // Clear the in-memory session even when browser storage is unavailable.
    }
    window.google?.accounts.id.disableAutoSelect();
    setEmail("");
    setError("");
    setStatus("signed-out");
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-18">
      {apiConfigured && googleConfigured ? (
        <Script
          src={GOOGLE_SCRIPT_SRC}
          onReady={() => setGoogleReady(true)}
          onError={() =>
            setError(
              "Google sign-in could not load. Please reload to try again.",
            )
          }
        />
      ) : null}
      <p className="text-sm tracking-wide uppercase">CUpid dashboard</p>
      <h1 className="mt-2 text-4xl font-semibold">Insights</h1>

      {status === "checking" ? (
        <p className="mt-4 text-lg leading-normal">Checking your session.</p>
      ) : null}

      {status === "signed-in" ? (
        <>
          <p className="mt-4 text-lg leading-normal">
            Signed in as {email || "a staff account"}.
          </p>
          <p className="mt-4 text-lg leading-normal">
            Charts are not available yet.
          </p>
          <Button className="mt-6" variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </>
      ) : null}

      {status === "signed-out" ? (
        <>
          <p className="mt-4 text-lg leading-normal">
            Sign in with a staff Google account.
          </p>
          {googleConfigured && apiConfigured ? (
            <div
              ref={buttonRef}
              className={`mt-6${
                signingIn ? " pointer-events-none opacity-50" : ""
              }`}
              aria-busy={signingIn}
              inert={signingIn}
            />
          ) : !googleConfigured ? (
            <p className="mt-6 text-muted-foreground">
              Google sign-in is not configured.
            </p>
          ) : null}
          {signingIn ? (
            <p className="mt-4" role="status">
              Signing in…
            </p>
          ) : null}
        </>
      ) : null}

      {!apiConfigured ? (
        <p className="mt-6 text-muted-foreground">
          The API address is not configured.
        </p>
      ) : null}

      {error ? (
        <p className="mt-6 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
};

export default HomePage;
