import { BadgeCheck, Heart } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { googleClientId, type SessionStatus } from "@/lib/use-staff-auth";

export function DashboardHeader({
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

export function StaffSignInCard({
  busy,
  buttonRef,
}: {
  busy: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
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
