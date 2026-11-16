import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiBadge = {
  text: string;
  tone: "positive" | "negative" | "pink" | "neutral";
};

type KpiCardProps = {
  label: string;
  value: string | null;
  valueAccentClass?: string;
  subtext?: string;
  badge?: KpiBadge | null;
  footer?: {
    label: string;
    value: string;
    valueClass?: string;
  } | null;
  icon?: ReactNode;
  className?: string;
};

const badgeToneClasses: Record<KpiBadge["tone"], string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-600",
  negative: "border-rose-200 bg-rose-50 text-rose-700",
  pink: "border-pink-200 bg-pink-50 text-[#db2777]",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
};

export function KpiCard({
  label,
  value,
  valueAccentClass,
  subtext,
  badge,
  footer,
  icon,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "h-full hover:shadow-[0_16px_30px_-4px_rgba(244,114,182,0.12),0_4px_12px_-2px_rgba(244,114,182,0.06)]",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col justify-between pt-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              {label}
            </span>
            {badge ? (
              <Badge
                className={cn(
                  "text-[11px] font-bold tabular-nums",
                  badgeToneClasses[badge.tone],
                )}
              >
                {badge.text}
              </Badge>
            ) : icon ? (
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-[#fb7185]"
                aria-hidden="true"
              >
                {icon}
              </span>
            ) : null}
          </div>

          <div className="mt-3">
            <p
              className={cn(
                "text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums",
                valueAccentClass,
              )}
            >
              {value ?? "Suppressed (<5)"}
            </p>
            {subtext ? (
              <p className="mt-1 text-[11px] text-slate-400 tabular-nums">
                {subtext}
              </p>
            ) : null}
          </div>
        </div>

        {footer ? (
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{footer.label}</span>
            <span
              className={cn(
                "font-semibold text-slate-700 tabular-nums",
                footer.valueClass,
              )}
            >
              {footer.value}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
