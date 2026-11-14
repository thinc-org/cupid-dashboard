import { Badge } from "@/components/ui/badge";
import { ROLLED_OTHER_KEY } from "@/lib/insights/enums";
import { cn } from "@/lib/utils";
import { formatCount, formatPercent } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

const barColors = ["bg-[#f472b6]", "bg-[#fb7185]", "bg-[#f9a8d4]"];

type MetricListProps = {
  items: LabeledBucket[];
  shareDenominator?: number;
};

export function MetricList({ items, shareDenominator }: MetricListProps) {
  const total =
    shareDenominator ?? items.reduce((sum, item) => sum + item.count, 0);

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const isOpenDeck = item.key === "no-restriction";
        const isOther = item.key === ROLLED_OTHER_KEY;
        const widthPercent =
          total > 0 && item.count > 0
            ? Math.min(Math.max((item.count / total) * 100, 1.5), 100)
            : 0;
        const barColor = isOpenDeck
          ? "bg-emerald-400"
          : isOther
            ? "bg-slate-300"
            : barColors[index % barColors.length];

        return (
          <li key={item.key} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-medium text-slate-700">
                  {item.label}
                </span>
                {isOpenDeck ? (
                  <Badge variant="emerald" className="px-1.5 py-0 text-[10px]">
                    Open Deck
                  </Badge>
                ) : null}
              </div>
              <span className="shrink-0 font-bold text-slate-900 tabular-nums">
                {formatCount(item.count)}{" "}
                <span className="font-normal text-slate-400">
                  ({formatPercent(item.count, total)})
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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
