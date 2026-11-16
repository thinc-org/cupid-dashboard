"use client";

import Script from "next/script";
import { InsightsDashboard } from "@/components/insights/insights-dashboard";
import {
  DashboardHeader,
  StaffSignInCard,
} from "@/components/staff-auth-shell";
import { Card, CardContent } from "@/components/ui/card";
import { googleClientId, useStaffAuth } from "@/lib/use-staff-auth";

export default function HomePage() {
  const {
    status,
    email,
    error,
    busy,
    buttonRef,
    setGoogleReady,
    setError,
    signOut,
  } = useStaffAuth();

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
