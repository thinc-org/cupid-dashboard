import { formatCount, formatPercent } from "../formatters";

export type LabeledBucket = {
  key: string;
  label: string;
  count: number;
};

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
  const peak = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const widthPercent = Math.max((item.count / peak) * 100, 4);
        const isOther = item.key === "other";
        return (
          <li key={item.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium text-foreground">
                {ranked ? (
                  <span className="mr-2 text-xs text-muted-foreground tabular-nums">
                    #{index + 1}
                  </span>
                ) : null}
                {item.label}
              </span>
              <span className="shrink-0 text-xs font-semibold text-foreground tabular-nums">
                {formatCount(item.count)}{" "}
                <span className="font-normal text-muted-foreground">
                  ({formatPercent(item.count, total)})
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={
                  isOther
                    ? "h-full rounded-full bg-muted-foreground/45 transition-all"
                    : "h-full rounded-full bg-gradient-to-r from-[#fb7185] to-[#f43f5e] transition-all"
                }
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
