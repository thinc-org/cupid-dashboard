"use client";

import { Filter, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FACULTY_OPTIONS,
  formatInsightLabel,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  ONBOARDED_OPTIONS,
  PAUSED_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  YEAR_OPTIONS,
  type EnumOption,
} from "@/lib/insights/enums";
import {
  bangkokToday,
  buildPresetRange,
  defaultInsightsFilters,
  type DatePreset,
  type InsightsFilters,
} from "@/lib/insights/filters";

type GlobalFilterBarProps = {
  filters: InsightsFilters;
  loading?: boolean;
  onApply: (next: InsightsFilters) => void;
  showDevMockToggle?: boolean;
  useDevMock?: boolean;
  onToggleDevMock?: (enabled: boolean) => void;
};

const datePresets: readonly { id: DatePreset; label: string }[] = [
  { id: "7d", label: "Last 7 Days" },
  { id: "14d", label: "Last 14 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "semester", label: "This Semester" },
];

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

  const activeChips = buildActiveChips(filters);
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DateInput
              label="From"
              value={draft.from}
              onChange={(value) => setDraft({ ...draft, from: value })}
            />
            <DateInput
              label="To"
              value={draft.to}
              onChange={(value) => setDraft({ ...draft, to: value })}
            />
            <SelectField
              label="Faculty"
              value={draft.faculty}
              options={FACULTY_OPTIONS}
              onChange={(value) => setDraft({ ...draft, faculty: value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SelectField
              label="Year"
              value={draft.year}
              options={YEAR_OPTIONS}
              onChange={(value) => setDraft({ ...draft, year: value })}
            />
            <SelectField
              label="Gender"
              value={draft.gender}
              options={GENDER_OPTIONS}
              onChange={(value) => setDraft({ ...draft, gender: value })}
            />
            <SelectField
              label="Relationship Goal"
              value={draft.relationshipGoal}
              options={RELATIONSHIP_GOAL_OPTIONS}
              onChange={(value) =>
                setDraft({ ...draft, relationshipGoal: value })
              }
            />
            <SelectField
              label="Onboarding"
              value={draft.onboarded}
              options={ONBOARDED_OPTIONS}
              onChange={(value) => setDraft({ ...draft, onboarded: value })}
            />
            <SelectField
              label="Account"
              value={draft.paused}
              options={PAUSED_OPTIONS}
              onChange={(value) => setDraft({ ...draft, paused: value })}
            />
            <InterestTagField
              value={draft.interest}
              onChange={(value) => setDraft({ ...draft, interest: value })}
            />
          </div>

          <FilterActionsFooter
            activeChips={activeChips}
            loading={loading}
            onRemoveChip={removeChip}
            onReset={handleReset}
          />
        </form>
      </CardContent>
    </Card>
  );
}

function FilterPresetHeader({
  filters,
  today,
  loading,
  onApplyPreset,
  showDevMockToggle,
  useDevMock,
  onToggleDevMock,
}: {
  filters: InsightsFilters;
  today: string;
  loading: boolean;
  onApplyPreset: (preset: DatePreset) => void;
  showDevMockToggle: boolean;
  useDevMock: boolean;
  onToggleDevMock?: (enabled: boolean) => void;
}) {
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

function InterestTagField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
      Interest tag
      <input
        list="cupid-interest-options"
        className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium normal-case text-slate-800 placeholder:text-slate-400 focus-visible:border-[#fb7185] focus-visible:ring-2 focus-visible:ring-[#fb7185]/20 focus-visible:outline-none"
        value={value}
        placeholder="e.g. food-coffee"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id="cupid-interest-options">
        {INTEREST_OPTIONS.map(([optValue, optLabel]) => (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        ))}
      </datalist>
    </label>
  );
}

function FilterActionsFooter({
  activeChips,
  loading,
  onRemoveChip,
  onReset,
}: {
  activeChips: { key: keyof InsightsFilters; name: string; label: string }[];
  loading: boolean;
  onRemoveChip: (key: keyof InsightsFilters) => void;
  onReset: () => void;
}) {
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

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
      {label}
      <input
        type="date"
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold normal-case text-slate-800 tabular-nums focus-visible:border-[#fb7185] focus-visible:ring-2 focus-visible:ring-[#fb7185]/20 focus-visible:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly EnumOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
      {label}
      <select
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold normal-case text-slate-800 focus-visible:border-[#fb7185] focus-visible:ring-2 focus-visible:ring-[#fb7185]/20 focus-visible:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Any</option>
        {options.map(([optValue, optLabel]) => (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildActiveChips(filters: InsightsFilters) {
  const chips: { key: keyof InsightsFilters; name: string; label: string }[] =
    [];
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
