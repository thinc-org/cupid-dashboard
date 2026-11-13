import { cn } from "@/lib/utils";
import { formatCount } from "../formatters";

export type BarChartCategory = {
  key: string;
  label: string;
  shortLabel?: string;
};

export type BarChartSeries = {
  label: string;
  colorClass: string;
  getValue: (key: string) => number;
  formatValue?: (value: number) => string;
};

type VerticalBarChartProps = {
  title: string;
  categories: BarChartCategory[];
  series: BarChartSeries[];
  emptyMessage?: string;
  showValues?: boolean;
  maxValue?: number;
};

/**
 * Shared responsive column bar chart for daily time-series and categorical
 * distributions. Columns fill 100% container width evenly and scroll only for
 * ranges wider than 14 bars.
 */
export function VerticalBarChart({
  title,
  categories,
  series,
  emptyMessage = "No days meet the minimum bucket size of 5.",
  showValues = false,
  maxValue,
}: VerticalBarChartProps) {
  if (categories.length === 0 || series.length === 0) {
    return (
      <div
        className="relative flex h-44 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-xs text-muted-foreground"
        role="img"
        aria-label={`${title}: no data available`}
      >
        {emptyMessage}
      </div>
    );
  }

  const isDual = series.length > 1;
  let peak = maxValue && maxValue > 0 ? maxValue : 1;
  for (const cat of categories) {
    for (const item of series) {
      peak = Math.max(peak, item.getValue(cat.key));
    }
  }

  const minWidthStyle =
    categories.length > 14
      ? { minWidth: `${categories.length * (isDual ? 54 : 44)}px` }
      : undefined;

  return (
    <div className="space-y-3" role="img" aria-label={title}>
      {isDual ? (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span
                className={cn("inline-block size-2.5 rounded-sm", item.colorClass)}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="relative w-full" style={minWidthStyle}>
          {/* Continuous full-width horizontal gridlines aligned with the 135px bar plot area (below 24px label headroom). */}
          <div
            className="pointer-events-none absolute inset-x-0 top-6 flex h-[136px] flex-col justify-between"
            aria-hidden="true"
          >
            <div className="border-t border-dashed border-border/80" />
            <div className="border-t border-dashed border-border/80" />
            <div className="border-t border-dashed border-border/80" />
            <div className="border-b border-border" />
          </div>

          <div className="relative z-10 flex w-full items-stretch gap-2 px-1 sm:gap-3">
            {categories.map((cat) => (
              <div
                key={cat.key}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                <div className="relative flex h-40 w-full items-end justify-center gap-1 pt-6 pb-px">
                  {series.map((item) => {
                    const val = item.getValue(cat.key);
                    const pct =
                      val > 0 ? Math.min(Math.max((val / peak) * 100, 4), 100) : 0;
                    const formatted = item.formatValue
                      ? item.formatValue(val)
                      : formatCount(val);
                    const barColor =
                      !isDual && cat.key === "other"
                        ? "bg-muted-foreground/50"
                        : item.colorClass;

                    return (
                      <div
                        key={item.label}
                        className={cn(
                          "relative rounded-t-md transition-[height] duration-300",
                          isDual ? "w-full max-w-5" : "w-full max-w-11",
                          barColor,
                        )}
                        style={{ height: `${pct}%` }}
                        title={`${cat.label} — ${item.label}: ${formatted}`}
                      >
                        {showValues && !isDual ? (
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-foreground tabular-nums">
                            {formatted}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <span
                  className="mt-1.5 max-w-full truncate text-center text-[11px] text-muted-foreground tabular-nums"
                  title={cat.label}
                >
                  {cat.shortLabel ?? cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
