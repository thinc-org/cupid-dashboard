import { Badge } from "@/components/ui/badge";
import { formatCount } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

type TagPillsProps = {
  items: LabeledBucket[];
};

export function TagPills({ items }: TagPillsProps) {
  const peak = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isTop = item.count >= peak * 0.65 && item.key !== "other";
        const isOther = item.key === "other";
        return (
          <Badge
            key={item.key}
            variant={isOther ? "muted" : isTop ? "default" : "soft"}
            className="gap-2 px-3 py-1.5 text-xs"
          >
            <span>{item.label}</span>
            <span
              className={
                isTop && !isOther
                  ? "rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                  : "rounded-full bg-background/80 px-1.5 py-0.5 text-[11px] font-semibold text-foreground tabular-nums"
              }
            >
              {formatCount(item.count)}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}
