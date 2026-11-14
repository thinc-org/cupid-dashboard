import { ROLLED_OTHER_KEY } from "@/lib/insights/enums";
import { formatCount } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

type TagPillsProps = {
  items: LabeledBucket[];
};

export function TagPills({ items }: TagPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isOther = item.key === ROLLED_OTHER_KEY;
        return (
          <span
            key={item.key}
            className={
              isOther
                ? "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                : "inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50/80 px-2.5 py-1 text-xs font-semibold text-[#db2777]"
            }
          >
            <span>{item.label}</span>
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold text-slate-800 shadow-2xs tabular-nums">
              {formatCount(item.count)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
