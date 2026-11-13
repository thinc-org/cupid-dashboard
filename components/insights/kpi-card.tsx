import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string | null;
  subtext?: string;
  delta?: {
    text: string;
    tone: "positive" | "negative" | "neutral";
  } | null;
  icon?: ReactNode;
  className?: string;
};

export function KpiCard({
  label,
  value,
  subtext,
  delta,
  icon,
  className,
}: KpiCardProps) {
  const deltaClass =
    delta?.tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : delta?.tone === "negative"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-border bg-secondary text-secondary-foreground";

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          {icon ? (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {value ?? "Suppressed (<5)"}
            </p>
            {delta ? (
              <Badge className={cn("text-[11px]", deltaClass)}>
                {delta.text}
              </Badge>
            ) : null}
          </div>
          {subtext ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {subtext}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
