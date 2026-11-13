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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-primary">
              <Filter className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Cohort &amp; Dimension Filters
              </h2>
              <p className="text-xs text-muted-foreground">
                Applies across all audience and daily deck charts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {datePresets.map((preset) => {
              const range = buildPresetRange(preset.id, today);
              const isCurrent =
                filters.from === range.from && filters.to === range.to;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  size="xs"
                  variant={isCurrent ? "default" : "outline"}
                  disabled={loading}
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.label}
                </Button>
              );
            })}
            {showDevMockToggle && onToggleDevMock ? (
              <Button
                type="button"
                size="xs"
                variant={useDevMock ? "secondary" : "outline"}
                onClick={() => onToggleDevMock(!useDevMock)}
                title="Local development preview using synthetic aggregate counts"
              >
                <Sparkles className="size-3" aria-hidden="true" />
                {useDevMock ? "Sample data: On" : "Preview sample data"}
              </Button>
            ) : null}
          </div>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            onApply(draft);
          }}
        >
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
          <SelectField
            label="Academic year"
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
            label="Relationship goal"
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
            label="Account state"
            value={draft.paused}
            options={PAUSED_OPTIONS}
            onChange={(value) => setDraft({ ...draft, paused: value })}
          />
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Interest tag
            <input
              list="cupid-interest-options"
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
              value={draft.interest}
              placeholder="e.g. food-coffee"
              onChange={(event) =>
                setDraft({ ...draft, interest: event.target.value })
              }
            />
            <datalist id="cupid-interest-options">
              {INTEREST_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </datalist>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" size="lg" className="flex-1" disabled={loading}>
              {loading ? "Loading…" : "Apply filters"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={loading}
              onClick={handleReset}
              title="Reset all filters"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Reset</span>
            </Button>
          </div>
        </form>

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              Active filters:
            </span>
            {activeChips.map((chip) => (
              <Badge key={chip.key} variant="soft" className="pr-1.5">
                <span>
                  {chip.name}: {chip.label}
                </span>
                <button
                  type="button"
                  className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-primary/15"
                  onClick={() => removeChip(chip.key)}
                  aria-label={`Remove ${chip.name} filter`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
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
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="date"
        className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground tabular-nums focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
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
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
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
