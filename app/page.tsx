"use client";

import { BadgeCheck, Heart } from "lucide-react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { InsightsDashboard } from "@/components/insights/insights-dashboard";
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
  const { status, email, error, busy, buttonRef, setGoogleReady, setError, signOut } =
    useStaffAuth();

  return (
    <div className="flex min-h-screen flex-col">
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

      <DashboardHeader
        status={status}
        email={email}
        busy={busy}
        onSignOut={signOut}
      />

      <main
        className={`mx-auto w-full flex-grow px-4 py-6 sm:px-8 ${status === "signed-in" ? "max-w-7xl" : "max-w-xl py-16"}`}
      >
        {status === "checking" ? (
          <Card className="mt-4">
            <CardContent className="pt-6 text-sm text-slate-500">
              Checking your staff session…
            </CardContent>
          </Card>
        ) : null}

        {status === "signed-in" ? <InsightsDashboard /> : null}

        {status === "signed-out" ? (
          <StaffSignInCard busy={busy} buttonRef={buttonRef} />
        ) : null}

        {error ? (
          <p className="mt-6 text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function useStaffAuth() {
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

  return {
    status,
    email,
    error,
    busy,
    buttonRef,
    setGoogleReady,
    setError,
    signOut,
  };
}

function DashboardHeader({
  status,
  email,
  busy,
  onSignOut,
}: {
  status: SessionStatus;
  email: string;
  busy: boolean;
  onSignOut: () => Promise<void>;
}) {
  const initialLetter = email.trim().charAt(0).toUpperCase() || "S";

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#fb7185] to-[#f472b6] shadow-md shadow-pink-300/30">
            <Heart className="size-5 fill-white text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-xs font-black tracking-widest text-[#f472b6] uppercase">
              Cupid Dashboard
            </span>
            <h1 className="text-xl leading-tight font-bold tracking-tight text-slate-900">
              Insights &amp; Analytics
            </h1>
          </div>
        </div>

        {status === "signed-in" ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-pink-100 bg-white px-3 py-1.5 shadow-xs">
              <span className="flex size-5 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-[#db2777]">
                {initialLetter}
              </span>
              <span className="text-xs font-medium text-slate-700">
                {email}
              </span>
              <BadgeCheck className="size-3.5 text-blue-500" aria-hidden="true" />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void onSignOut()}
            >
              {busy ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function StaffSignInCard({
  busy,
  buttonRef,
}: {
  busy: boolean;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Card className="mt-4">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff sign-in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with an allowlisted Google account to view aggregate cohort
            and deck insights.
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
          <p className="text-sm text-slate-500">
            Google sign-in is not configured.
          </p>
        )}
        {busy ? (
          <p className="text-sm text-slate-500" role="status">
            Signing in…
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
