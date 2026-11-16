import {
  FACULTY_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  ONBOARDED_OPTIONS,
  PAUSED_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  YEAR_OPTIONS,
  type EnumOption,
} from "@/lib/insights/enums";
import type { InsightsFilters } from "@/lib/insights/filters";

type FilterFormFieldsProps = {
  draft: InsightsFilters;
  onChange: (next: InsightsFilters) => void;
};

export function FilterFormFields({ draft, onChange }: FilterFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DateInput
          label="From"
          value={draft.from}
          onChange={(value) => onChange({ ...draft, from: value })}
        />
        <DateInput
          label="To"
          value={draft.to}
          onChange={(value) => onChange({ ...draft, to: value })}
        />
        <SelectField
          label="Faculty"
          value={draft.faculty}
          options={FACULTY_OPTIONS}
          onChange={(value) => onChange({ ...draft, faculty: value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SelectField
          label="Year"
          value={draft.year}
          options={YEAR_OPTIONS}
          onChange={(value) => onChange({ ...draft, year: value })}
        />
        <SelectField
          label="Gender"
          value={draft.gender}
          options={GENDER_OPTIONS}
          onChange={(value) => onChange({ ...draft, gender: value })}
        />
        <SelectField
          label="Relationship Goal"
          value={draft.relationshipGoal}
          options={RELATIONSHIP_GOAL_OPTIONS}
          onChange={(value) => onChange({ ...draft, relationshipGoal: value })}
        />
        <SelectField
          label="Onboarding"
          value={draft.onboarded}
          options={ONBOARDED_OPTIONS}
          onChange={(value) => onChange({ ...draft, onboarded: value })}
        />
        <SelectField
          label="Account"
          value={draft.paused}
          options={PAUSED_OPTIONS}
          onChange={(value) => onChange({ ...draft, paused: value })}
        />
        <InterestTagField
          value={draft.interest}
          onChange={(value) => onChange({ ...draft, interest: value })}
        />
      </div>
    </>
  );
}

const fieldLabelClass =
  "grid min-w-0 content-end gap-1 text-[11px] font-bold tracking-wider text-slate-600 uppercase";
const fieldControlClass =
  "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold normal-case text-slate-800 focus-visible:border-[#fb7185] focus-visible:ring-2 focus-visible:ring-[#fb7185]/20 focus-visible:outline-none";

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
    <label className={fieldLabelClass}>
      {label}
      <input
        type="date"
        className={`${fieldControlClass} tabular-nums`}
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
    <label className={fieldLabelClass}>
      {label}
      <select
        className={fieldControlClass}
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

function InterestTagField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={fieldLabelClass}>
      Interest tag
      <input
        list="cupid-interest-options"
        className={`${fieldControlClass} placeholder:font-medium placeholder:text-slate-400`}
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
