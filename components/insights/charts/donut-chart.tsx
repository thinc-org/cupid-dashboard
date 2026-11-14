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
  centerLabelClass?: string;
  segments: readonly [DonutSegment, DonutSegment];
};

export function DonutChart({
  title,
  centerLabel,
  centerLabelClass = "text-slate-400",
  segments,
}: DonutChartProps) {
  const [primary, secondary] = segments;
  const total = primary.count + secondary.count;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const primaryRatio = total > 0 ? primary.count / total : 0;
  const primaryArc = primaryRatio * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-2 sm:flex-row">
      <div className="relative size-36 shrink-0">
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
            strokeWidth="15"
            className={secondary.strokeClass}
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            strokeWidth="15"
            strokeDasharray={`${primaryArc} ${circumference}`}
            strokeLinecap="round"
            className={primary.strokeClass}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl leading-tight font-extrabold text-slate-900 tabular-nums">
            {formatPercent(primary.count, total)}
          </span>
          <span className={`text-[10px] font-bold uppercase ${centerLabelClass}`}>
            {centerLabel}
          </span>
        </div>
      </div>

      <dl className="w-full space-y-2.5 sm:w-auto sm:min-w-[13rem]">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <dt className="flex items-center gap-2 text-slate-700">
              <span
                className={`size-3 shrink-0 rounded-full ${segment.dotClass}`}
                aria-hidden="true"
              />
              <span className="font-medium">{segment.label}</span>
            </dt>
            <dd className="font-bold text-slate-900 tabular-nums">
              {formatCount(segment.count)}{" "}
              <span className="ml-0.5 font-normal text-slate-400">
                ({formatPercent(segment.count, total)})
              </span>
            </dd>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-400 tabular-nums">
          Total in filter:{" "}
          <strong className="text-slate-600">{formatCount(total)}</strong>
        </div>
      </dl>
    </div>
  );
}
