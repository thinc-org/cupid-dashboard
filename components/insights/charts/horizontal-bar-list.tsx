import { cn } from "@/lib/utils";
import { formatCount, formatPercent } from "../formatters";

export type LabeledBucket = {
  key: string;
  label: string;
  count: number;
};

const barShades = [
  "bg-[#f472b6]",
  "bg-[#fb7185]",
  "bg-[#f9a8d4]",
  "bg-[#fbcfe8]",
  "bg-[#fce7f3] border border-[#fbcfe8]",
];

type HorizontalBarListProps = {
  items: LabeledBucket[];
  shareDenominator?: number;
  ranked?: boolean;
};

export function HorizontalBarList({
  items,
  shareDenominator,
  ranked = true,
}: HorizontalBarListProps) {
  const total =
    shareDenominator ?? items.reduce((sum, item) => sum + item.count, 0);

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const widthPercent =
          total > 0 && item.count > 0
            ? Math.min(Math.max((item.count / total) * 100, 1.5), 100)
            : 0;
        const isOther = item.key === "other";
        const barColor = isOther
          ? "bg-slate-300"
          : barShades[index % barShades.length];

        return (
          <li key={item.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span
                className={cn(
                  "truncate font-medium",
                  isOther ? "italic text-slate-500" : "text-slate-700",
                )}
              >
                {ranked && !isOther ? (
                  <span className="mr-1.5 text-[11px] font-semibold text-slate-400 tabular-nums">
                    #{index + 1}
                  </span>
                ) : null}
                {item.label}
              </span>
              <span className="shrink-0 font-bold text-slate-900 tabular-nums">
                {formatCount(item.count)}{" "}
                <span className="font-normal text-slate-400">
                  ({formatPercent(item.count, total)})
                </span>
              </span>
            </div>
            <div
              className={cn(
                "h-2 w-full overflow-hidden rounded-full",
                isOther ? "bg-slate-100" : "bg-pink-50",
              )}
            >
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
