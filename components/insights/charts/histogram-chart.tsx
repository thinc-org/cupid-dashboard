import { formatCount, formatPercent } from "../formatters";
import type { LabeledBucket } from "./horizontal-bar-list";

type HistogramChartProps = {
  title: string;
  items: LabeledBucket[];
};

export function HistogramChart({ title, items }: HistogramChartProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const peak = Math.max(...items.map((item) => item.count), 1);
  const slotWidth = 68;
  const width = Math.max(items.length * slotWidth, 280);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} 156`}
          className="h-40 w-full min-w-[280px]"
          role="img"
          aria-label={title}
        >
          {[28, 60, 92, 124].map((y) => (
            <line
              key={y}
              x1="0"
              x2={width}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeDasharray={y === 124 ? undefined : "4 4"}
            />
          ))}
          {items.map((item, index) => {
            const barHeight = Math.max((item.count / peak) * 86, 4);
            const x = index * slotWidth + slotWidth / 2 - 16;
            const y = 124 - barHeight;
            return (
              <g key={item.key}>
                <text
                  x={x + 16}
                  y={Math.max(y - 6, 14)}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold tabular-nums"
                >
                  {formatCount(item.count)}
                </text>
                <rect
                  x={x}
                  y={y}
                  width="32"
                  height={barHeight}
                  rx="6"
                  className={
                    item.key === "other"
                      ? "fill-muted-foreground/50"
                      : "fill-[#fb7185]"
                  }
                >
                  <title>{`${item.label}: ${formatCount(item.count)} (${formatPercent(item.count, total)})`}</title>
                </rect>
                <text
                  x={x + 16}
                  y="142"
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
