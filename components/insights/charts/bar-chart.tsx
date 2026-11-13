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
  getColorClass?: (key: string, isPeak: boolean) => string;
  formatValue?: (value: number) => string;
};

type VerticalBarChartProps = {
  title: string;
  categories: BarChartCategory[];
  series: BarChartSeries[];
  emptyMessage?: string;
  showValues?: boolean;
  highlightPeak?: boolean;
  maxValue?: number;
};

/**
 * Shared responsive column bar chart for daily time-series and categorical
 * distributions with dark slate hover tooltips.
 */
export function VerticalBarChart({
  title,
  categories,
  series,
  emptyMessage = "No days meet the minimum bucket size of 5.",
  showValues = false,
  highlightPeak = false,
  maxValue,
}: VerticalBarChartProps) {
  if (categories.length === 0 || series.length === 0) {
    return (
      <div
        className="relative flex h-44 items-center justify-center rounded-xl border border-dashed border-pink-200 bg-pink-50/40 text-xs text-slate-400"
        role="img"
        aria-label={`${title}: no data available`}
      >
        {emptyMessage}
      </div>
    );
  }

  const isDual = series.length > 1;
  let peak = maxValue && maxValue > 0 ? maxValue : 1;
  let peakKey = "";
  let peakPrimary = -1;

  for (const cat of categories) {
    const primaryVal = series[0].getValue(cat.key);
    if (primaryVal > peakPrimary) {
      peakPrimary = primaryVal;
      peakKey = cat.key;
    }
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
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span
                className={cn("inline-block size-3 rounded-md shadow-xs", item.colorClass)}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="relative w-full" style={minWidthStyle}>
          {/* Continuous horizontal gridlines aligned with the 135px bar plot area. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-6 flex h-[136px] flex-col justify-between"
            aria-hidden="true"
          >
            <div className="border-t border-dashed border-pink-100" />
            <div className="border-t border-dashed border-pink-100" />
            <div className="border-t border-dashed border-pink-100" />
            <div className="border-b border-slate-200" />
          </div>

          <div className="relative z-10 flex w-full items-stretch gap-1.5 px-1 sm:gap-2">
            {categories.map((cat) => {
              const isPeak = highlightPeak && cat.key === peakKey;
              return (
                <div
                  key={cat.key}
                  className="group relative flex min-w-0 flex-1 flex-col items-center"
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
                          ? "bg-slate-300"
                          : item.getColorClass
                            ? item.getColorClass(cat.key, isPeak)
                            : item.colorClass;

                      return (
                        <div
                          key={item.label}
                          className={cn(
                            "relative rounded-t-md transition-all duration-300 group-hover:brightness-105",
                            isDual ? "w-full max-w-4" : "w-full max-w-12",
                            barColor,
                          )}
                          style={{ height: `${pct}%` }}
                        >
                          {showValues && !isDual ? (
                            <span
                              className={cn(
                                "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold tabular-nums",
                                isPeak ? "text-[#db2777]" : "text-slate-700",
                              )}
                            >
                              {formatted}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <span
                    className={cn(
                      "mt-2 max-w-full truncate text-center text-[11px] tabular-nums",
                      isPeak
                        ? "font-bold text-[#db2777]"
                        : "font-medium text-slate-500",
                    )}
                    title={cat.label}
                  >
                    {cat.shortLabel ?? cat.label}
                  </span>

                  {/* Hover tooltip matching prototype */}
                  <div className="pointer-events-none absolute bottom-12 z-20 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] whitespace-nowrap text-white shadow-xl group-hover:block">
                    <span className="block font-bold text-pink-200">
                      {cat.label}
                    </span>
                    {series.map((item) => {
                      const val = item.getValue(cat.key);
                      const formatted = item.formatValue
                        ? item.formatValue(val)
                        : formatCount(val);
                      return (
                        <span key={item.label} className="block text-slate-100 tabular-nums">
                          {item.label}: {formatted}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
