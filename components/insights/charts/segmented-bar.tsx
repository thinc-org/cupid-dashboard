import { formatCount, formatPercent } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

const segmentColors = [
  "bg-[#f43f5e]",
  "bg-[#fb7185]",
  "bg-[#f472b6]",
  "bg-[#c084fc]",
  "bg-[#fb923c]",
  "bg-[#fda4af]",
  "bg-slate-400",
];

type SegmentedBarProps = {
  items: LabeledBucket[];
};

export function SegmentedBar({ items }: SegmentedBarProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      <div
        className="flex h-3.5 w-full overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label="Distribution breakdown"
      >
        {items.map((item, index) => {
          const share = total > 0 ? (item.count / total) * 100 : 0;
          const color =
            item.key === "other"
              ? "bg-slate-400"
              : segmentColors[index % segmentColors.length];
          return (
            <div
              key={item.key}
              className={`${color} h-full border-r border-card last:border-r-0`}
              style={{ width: `${share}%` }}
              title={`${item.label}: ${formatCount(item.count)} (${formatPercent(item.count, total)})`}
            />
          );
        })}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => {
          const color =
            item.key === "other"
              ? "bg-slate-400"
              : segmentColors[index % segmentColors.length];
          return (
            <li
              key={item.key}
              className="flex items-center justify-between gap-2 rounded-lg bg-secondary/45 px-3 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${color}`}
                  aria-hidden="true"
                />
                <span className="truncate font-medium">{item.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">
                {formatCount(item.count)}{" "}
                <span className="font-normal text-muted-foreground">
                  ({formatPercent(item.count, total)})
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
