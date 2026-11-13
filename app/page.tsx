"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { InsightsDashboard } from "@/components/insights/insights-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SessionStatus = "checking" | "signed-out" | "signed-in";
type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            hd?: string;
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

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
const readErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => null);
  return typeof body?.message === "string" ? body.message : "";
};

export default function HomePage() {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);
  const signingInRef = useRef(false);
  const signInRef = useRef<(credential: string) => void>(() => {});

  signInRef.current = (credential) => {
    if (status !== "signed-out" || signingInRef.current) return;
    signingInRef.current = true;
    setBusy(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
          credentials: "same-origin",
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          setError(
            (await readErrorMessage(response)) ||
              "Google sign-in was rejected.",
          );
          return;
        }
        const body = await response.json();
        if (typeof body?.email !== "string" || !body.email.trim()) {
          setError("The dashboard returned an invalid staff session.");
          return;
        }
        setEmail(body.email);
        setStatus("signed-in");
      } catch {
        setError(
          "The dashboard could not reach its sign-in service. Please try again.",
        );
      } finally {
        signingInRef.current = false;
        setBusy(false);
      }
    })();
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          const message = await readErrorMessage(response);
          if (cancelled) return;
          if (response.status !== 401)
            setError(message || "Could not check your session.");
          setStatus("signed-out");
          return;
        }
        const body = await response.json();
        if (cancelled) return;
        if (typeof body?.email !== "string" || !body.email.trim()) {
          setError("The dashboard returned an invalid staff session.");
          setStatus("signed-out");
          return;
        }
        setEmail(body.email);
        setStatus("signed-in");
      } catch {
        if (!cancelled) {
          setError(
            "The dashboard could not check your session. Please try again.",
          );
          setStatus("signed-out");
        }
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const parent = buttonRef.current;
    const google = window.google?.accounts.id;
    if (
      status !== "signed-out" ||
      !googleClientId ||
      !googleReady ||
      !parent ||
      !google
    )
      return;
    if (!googleInitializedRef.current) {
      google.initialize({
        client_id: googleClientId,
        auto_select: false,
        hd: "student.chula.ac.th",
        callback: (response) => signInRef.current(response.credential),
      });
      googleInitializedRef.current = true;
    }
    parent.replaceChildren();
    google.renderButton(parent, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280,
    });
    return () => parent.replaceChildren();
  }, [googleReady, status]);

  const signOut = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        setError("Could not sign out. Please try again.");
        return;
      }
      window.google?.accounts.id.disableAutoSelect();
      setEmail("");
      setStatus("signed-out");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className={`mx-auto px-6 py-10 ${status === "signed-in" ? "max-w-7xl" : "max-w-xl py-20"}`}
    >
      {googleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          onReady={() => setGoogleReady(true)}
          onError={() =>
            setError(
              "Google sign-in could not load. Please reload to try again.",
            )
          }
        />
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="soft">CUpid Staff Analytics</Badge>
            <Badge variant="outline">k ≥ 5 aggregate-only</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Insights Dashboard
          </h1>
        </div>

        {status === "signed-in" ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2 shadow-[0_1px_2px_rgba(244,63,94,0.05)]">
            <span className="text-xs font-medium text-muted-foreground">
              {email}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void signOut()}
            >
              {busy ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        ) : null}
      </header>

      {status === "checking" ? (
        <Card className="mt-8">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Checking your staff session…
          </CardContent>
        </Card>
      ) : null}

      {status === "signed-in" ? <InsightsDashboard /> : null}

      {status === "signed-out" ? (
        <Card className="mt-8">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Staff sign-in
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with an allowlisted Google account to view aggregate
                cohort and deck insights.
              </p>
            </div>
            {googleClientId ? (
              <div
                ref={buttonRef}
                className={busy ? "pointer-events-none opacity-50" : undefined}
                aria-busy={busy}
                inert={busy}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Google sign-in is not configured.
              </p>
            )}
            {busy ? (
              <p className="text-sm text-muted-foreground" role="status">
                Signing in…
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p className="mt-6 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
}
