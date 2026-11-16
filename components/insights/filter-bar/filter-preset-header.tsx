import { Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildPresetRange,
  type DatePreset,
  type InsightsFilters,
} from "@/lib/insights/filters";

const datePresets: readonly { id: DatePreset; label: string }[] = [
  { id: "7d", label: "Last 7 Days" },
  { id: "14d", label: "Last 14 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "semester", label: "This Semester" },
];

type FilterPresetHeaderProps = {
  filters: InsightsFilters;
  today: string;
  loading: boolean;
  onApplyPreset: (preset: DatePreset) => void;
  showDevMockToggle: boolean;
  useDevMock: boolean;
  onToggleDevMock?: (enabled: boolean) => void;
};

export function FilterPresetHeader({
  filters,
  today,
  loading,
  onApplyPreset,
  showDevMockToggle,
  useDevMock,
  onToggleDevMock,
}: FilterPresetHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-2 border-b border-pink-50 pb-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-[#fb7185]" aria-hidden="true" />
        <h2 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
          Filter Dimensions
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600">
        <span className="mr-1 hidden text-[11px] text-slate-400 md:inline">
          Quick Presets:
        </span>
        {datePresets.map((preset) => {
          const range = buildPresetRange(preset.id, today);
          const isCurrent =
            filters.from === range.from && filters.to === range.to;
          return (
            <Button
              key={preset.id}
              type="button"
              size="xs"
              variant={isCurrent ? "gradient" : "secondary"}
              disabled={loading}
              onClick={() => onApplyPreset(preset.id)}
            >
              {preset.label}
            </Button>
          );
        })}
        {showDevMockToggle && onToggleDevMock ? (
          <Button
            type="button"
            size="xs"
            variant={useDevMock ? "gradient" : "outline"}
            onClick={() => onToggleDevMock(!useDevMock)}
            title="Local development preview using synthetic aggregate counts"
          >
            <Sparkles className="size-3" aria-hidden="true" />
            {useDevMock ? "Sample data: On" : "Preview sample data"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
