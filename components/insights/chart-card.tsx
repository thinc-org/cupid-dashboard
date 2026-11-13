import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
};

export function ChartCard({
  title,
  description,
  headerAction,
  empty = false,
  emptyMessage = "No cohorts with at least 5 records in the current filter.",
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </CardHeader>
      <CardContent className="flex-1">
        {empty ? (
          <div
            className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-xs text-muted-foreground"
            role="status"
          >
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
