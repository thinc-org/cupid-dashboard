import { formatCount, formatPercent } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

const segmentPalettes = [
  {
    bar: "bg-[#f472b6]",
    dot: "bg-[#f472b6]",
    card: "border-pink-100 bg-pink-50/60",
    pct: "text-[#db2777]",
  },
  {
    bar: "bg-indigo-300",
    dot: "bg-indigo-400",
    card: "border-indigo-100/70 bg-indigo-50/50",
    pct: "text-indigo-600",
  },
  {
    bar: "bg-purple-200",
    dot: "bg-purple-300",
    card: "border-purple-100/70 bg-purple-50/50",
    pct: "text-purple-600",
  },
  {
    bar: "bg-[#fb7185]",
    dot: "bg-[#fb7185]",
    card: "border-rose-100 bg-rose-50/50",
    pct: "text-rose-600",
  },
];

const otherPalette = {
  bar: "bg-slate-300",
  dot: "bg-slate-400",
  card: "border-slate-200/70 bg-slate-50",
  pct: "text-slate-600",
};

type SegmentedBarProps = {
  items: LabeledBucket[];
};

export function SegmentedBar({ items }: SegmentedBarProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner"
        role="img"
        aria-label="Distribution breakdown"
      >
        {items.map((item, index) => {
          const share = total > 0 ? (item.count / total) * 100 : 0;
          const palette =
            item.key === "other"
              ? otherPalette
              : segmentPalettes[index % segmentPalettes.length];
          return (
            <div
              key={item.key}
              className={`${palette.bar} h-full border-r border-white last:border-r-0`}
              style={{ width: `${share}%` }}
              title={`${item.label}: ${formatCount(item.count)} (${formatPercent(item.count, total)})`}
            />
          );
        })}
      </div>

      <ul className="space-y-2.5">
        {items.map((item, index) => {
          const palette =
            item.key === "other"
              ? otherPalette
              : segmentPalettes[index % segmentPalettes.length];
          return (
            <li
              key={item.key}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs ${palette.card}`}
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-800">
                <span
                  className={`size-3 shrink-0 rounded-full ${palette.dot}`}
                  aria-hidden="true"
                />
                <span className="truncate font-semibold">{item.label}</span>
              </span>
              <span className="shrink-0 font-bold text-slate-900 tabular-nums">
                {formatCount(item.count)}{" "}
                <span className={`ml-0.5 font-semibold ${palette.pct}`}>
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
