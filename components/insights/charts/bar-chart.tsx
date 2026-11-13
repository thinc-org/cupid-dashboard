import { formatCount } from "../formatters";

export type BarSeries = {
  label: string;
  color: string;
  values: Map<string, number>;
};

export type SingleSeriesPoint = {
  date: string;
  value: number;
};

type VerticalBarChartProps = {
  title: string;
  dates: string[];
  series: {
    label: string;
    colorClass: string;
    getValue: (date: string) => number;
    formatValue?: (value: number) => string;
  }[];
};

export function VerticalBarChart({
  title,
  dates,
  series,
}: VerticalBarChartProps) {
  if (dates.length === 0 || series.length === 0) {
    return (
      <div
        className="relative flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-xs text-muted-foreground"
        role="img"
        aria-label={`${title}: no data available`}
      >
        No days meet the minimum bucket size of 5.
      </div>
    );
  }

  const isDual = series.length > 1;
  const slotWidth = isDual ? 58 : 48;
  const barWidth = isDual ? 16 : 24;
  const width = Math.max(dates.length * slotWidth, 320);

  let peak = 1;
  for (const date of dates) {
    for (const item of series) {
      peak = Math.max(peak, item.getValue(date));
    }
  }

  return (
    <div className="space-y-3">
      {isDual ? (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block size-2.5 rounded-sm ${item.colorClass}`}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} 152`}
          className="h-40"
          style={{ width }}
          role="img"
          aria-label={title}
        >
          {[22, 54, 86, 118].map((y) => (
            <line
              key={y}
              x1="0"
              x2={width}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeDasharray={y === 118 ? undefined : "4 4"}
            />
          ))}
          {dates.map((date, index) => {
            const xOffset = index * slotWidth + 10;
            return (
              <g key={date} transform={`translate(${xOffset} 0)`}>
                {series.map((item, sIndex) => {
                  const val = item.getValue(date);
                  const height = val > 0 ? Math.max((val / peak) * 94, 3) : 0;
                  const x = isDual ? sIndex * (barWidth + 4) + 2 : 7;
                  const formatted = item.formatValue
                    ? item.formatValue(val)
                    : formatCount(val);
                  return (
                    <rect
                      key={item.label}
                      x={x}
                      y={118 - height}
                      width={barWidth}
                      height={height}
                      rx="4"
                      className={item.colorClass}
                    >
                      <title>{`${date} — ${item.label}: ${formatted}`}</title>
                    </rect>
                  );
                })}
                <text
                  x={isDual ? 20 : 19}
                  y="136"
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px] tabular-nums"
                >
                  {date.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
