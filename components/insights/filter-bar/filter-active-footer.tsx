import { RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInsightLabel } from "@/lib/insights/enums";
import type { InsightsFilters } from "@/lib/insights/filters";

export type ActiveFilterChip = {
  key: keyof InsightsFilters;
  name: string;
  label: string;
};

type FilterActionsFooterProps = {
  filters: InsightsFilters;
  loading: boolean;
  onRemoveChip: (key: keyof InsightsFilters) => void;
  onReset: () => void;
};

export function FilterActionsFooter({
  filters,
  loading,
  onRemoveChip,
  onReset,
}: FilterActionsFooterProps) {
  const activeChips = buildActiveChips(filters);

  return (
    <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-1.5">
        {activeChips.length > 0 ? (
          <>
            <span className="mr-1 text-[11px] font-semibold text-slate-400">
              Active:
            </span>
            {activeChips.map((chip) => (
              <Badge key={chip.key} variant="soft" className="pr-1.5">
                <span>
                  {chip.name}: {chip.label}
                </span>
                <button
                  type="button"
                  className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[#fb7185] hover:bg-pink-100 hover:text-[#db2777]"
                  onClick={() => onRemoveChip(chip.key)}
                  aria-label={`Remove ${chip.name} filter`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="lg"
          variant="ghost"
          disabled={loading}
          onClick={onReset}
          title="Reset all filters"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset filters
        </Button>
        <Button type="submit" size="lg" variant="gradient" disabled={loading}>
          {loading ? "Updating…" : "Apply filters"}
        </Button>
      </div>
    </div>
  );
}

function buildActiveChips(filters: InsightsFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (filters.faculty) {
    chips.push({
      key: "faculty",
      name: "Faculty",
      label: formatInsightLabel("faculty", filters.faculty),
    });
  }
  if (filters.year) {
    chips.push({
      key: "year",
      name: "Year",
      label: formatInsightLabel("year", filters.year),
    });
  }
  if (filters.gender) {
    chips.push({
      key: "gender",
      name: "Gender",
      label: formatInsightLabel("gender", filters.gender),
    });
  }
  if (filters.relationshipGoal) {
    chips.push({
      key: "relationshipGoal",
      name: "Goal",
      label: formatInsightLabel("relationshipGoal", filters.relationshipGoal),
    });
  }
  if (filters.onboarded) {
    chips.push({
      key: "onboarded",
      name: "Onboarding",
      label:
        filters.onboarded === "onboarded" ? "Onboarded" : "Not onboarded",
    });
  }
  if (filters.paused) {
    chips.push({
      key: "paused",
      name: "Account",
      label: filters.paused === "paused" ? "Paused now" : "Active",
    });
  }
  if (filters.interest) {
    chips.push({
      key: "interest",
      name: "Interest",
      label: formatInsightLabel("interest", filters.interest),
    });
  }
  return chips;
}
