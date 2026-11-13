import { formatCount, formatPercent } from "../formatters";

type DonutSegment = {
  label: string;
  count: number;
  strokeClass: string;
  dotClass: string;
};

type DonutChartProps = {
  title: string;
  centerLabel: string;
  segments: readonly [DonutSegment, DonutSegment];
};

export function DonutChart({ title, centerLabel, segments }: DonutChartProps) {
  const [primary, secondary] = segments;
  const total = primary.count + secondary.count;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const primaryRatio = total > 0 ? primary.count / total : 0;
  const primaryArc = primaryRatio * circumference;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative size-32 shrink-0">
        <svg
          viewBox="0 0 112 112"
          className="size-full -rotate-90"
          role="img"
          aria-label={`${title}: ${primary.label} ${formatPercent(primary.count, total)}`}
        >
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            strokeWidth="14"
            className={secondary.strokeClass}
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            strokeWidth="14"
            strokeDasharray={`${primaryArc} ${circumference}`}
            strokeLinecap="round"
            className={primary.strokeClass}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatPercent(primary.count, total)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {centerLabel}
          </span>
        </div>
      </div>

      <dl className="grid w-full gap-2.5 text-sm">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-center justify-between gap-3 rounded-lg bg-secondary/45 px-3 py-2"
          >
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span
                className={`size-2.5 shrink-0 rounded-full ${segment.dotClass}`}
                aria-hidden="true"
              />
              <span>{segment.label}</span>
            </dt>
            <dd className="font-semibold text-foreground tabular-nums">
              {formatCount(segment.count)}{" "}
              <span className="font-normal text-muted-foreground">
                ({formatPercent(segment.count, total)})
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
