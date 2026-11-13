import { Badge } from "@/components/ui/badge";
import { formatCount, formatPercent } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

type MetricListProps = {
  items: LabeledBucket[];
  shareDenominator?: number;
};

export function MetricList({ items, shareDenominator }: MetricListProps) {
  const total =
    shareDenominator ?? items.reduce((sum, item) => sum + item.count, 0);

  return (
    <ul className="divide-y divide-border/80">
      {items.map((item) => {
        const isOpenDeck = item.key === "no-restriction";
        return (
          <li
            key={item.key}
            className={
              isOpenDeck
                ? "flex items-center justify-between gap-3 rounded-lg bg-secondary/70 px-3 py-2 text-sm"
                : "flex items-center justify-between gap-3 px-1 py-2 text-sm"
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-foreground">
                {item.label}
              </span>
              {isOpenDeck ? (
                <Badge variant="outline" className="text-[10px]">
                  Empty list
                </Badge>
              ) : null}
            </div>
            <span className="shrink-0 text-xs font-semibold text-foreground tabular-nums">
              {formatCount(item.count)}{" "}
              <span className="font-normal text-muted-foreground">
                ({formatPercent(item.count, total)})
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
