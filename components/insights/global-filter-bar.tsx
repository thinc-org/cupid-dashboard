"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  bangkokToday,
  buildPresetRange,
  defaultInsightsFilters,
  type DatePreset,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { FilterActionsFooter } from "./filter-bar/filter-active-footer";
import { FilterFormFields } from "./filter-bar/filter-form-fields";
import { FilterPresetHeader } from "./filter-bar/filter-preset-header";

type GlobalFilterBarProps = {
  filters: InsightsFilters;
  loading?: boolean;
  onApply: (next: InsightsFilters) => void;
  showDevMockToggle?: boolean;
  useDevMock?: boolean;
  onToggleDevMock?: (enabled: boolean) => void;
};

export function GlobalFilterBar({
  filters,
  loading = false,
  onApply,
  showDevMockToggle = false,
  useDevMock = false,
  onToggleDevMock,
}: GlobalFilterBarProps) {
  const [draft, setDraft] = useState<InsightsFilters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const today = bangkokToday();

  const applyPreset = (preset: DatePreset) => {
    const range = buildPresetRange(preset, today);
    const next = { ...filters, ...range };
    setDraft(next);
    onApply(next);
  };

  const removeChip = (key: keyof InsightsFilters) => {
    const next = { ...filters, [key]: "" };
    setDraft(next);
    onApply(next);
  };

  const handleReset = () => {
    const next = defaultInsightsFilters(today);
    setDraft(next);
    onApply(next);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <FilterPresetHeader
          filters={filters}
          today={today}
          loading={loading}
          onApplyPreset={applyPreset}
          showDevMockToggle={showDevMockToggle}
          useDevMock={useDevMock}
          onToggleDevMock={onToggleDevMock}
        />

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onApply(draft);
          }}
        >
          <FilterFormFields draft={draft} onChange={setDraft} />

          <FilterActionsFooter
            filters={filters}
            loading={loading}
            onRemoveChip={removeChip}
            onReset={handleReset}
          />
        </form>
      </CardContent>
    </Card>
  );
}
