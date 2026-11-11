"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DailyDeckInsights } from "@/lib/insights/daily-decks";

type Filters = {
  from: string;
  to: string;
  faculty: string;
  year: string;
  gender: string;
  relationshipGoal: string;
  onboarded: string;
  paused: string;
  interest: string;
};

const genders = [
  ["female", "Female"],
  ["male", "Male"],
  ["non-binary", "Non-binary"],
  ["other", "Other"],
] as const;

const relationshipGoals = [
  ["long-term-partner", "Long-term partner"],
  ["long-term-but-casual-ok", "Long-term, casual OK"],
  ["casual-but-long-term-ok", "Casual, long-term OK"],
  ["casual-fun", "Casual fun"],
  ["new-friends", "New friends"],
  ["still-figuring-it-out", "Still figuring it out"],
] as const;

export function DailyDeckInsightsPanel() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [insights, setInsights] = useState<DailyDeckInsights | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const to = bangkokToday();
    setFilters({
      from: shiftIsoDate(to, -13),
      to,
      faculty: "",
      year: "",
      gender: "",
      relationshipGoal: "",
      onboarded: "",
      paused: "",
      interest: "",
    });
  }, []);

  useEffect(() => {
    if (!filters) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch(
          `/api/insights/daily-decks?${queryString(filters)}`,
          {
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        const body = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok) {
          setInsights(null);
          setError(
            typeof body?.message === "string"
              ? body.message
              : "Deck insights could not be loaded.",
          );
          return;
        }
        if (
          !body ||
          !Array.isArray(body.days) ||
          typeof body.minimumBucket !== "number"
        ) {
          setInsights(null);
          setError("Deck insights returned an unexpected response.");
          return;
        }
        setInsights({ minimumBucket: body.minimumBucket, days: body.days });
      } catch {
        if (active) {
          setInsights(null);
          setError(
            controller.signal.aborted
              ? "Deck insights took too long to load. Please try again."
              : "Deck insights could not be reached.",
          );
        }
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filters]);

  if (!filters) return <p className="mt-8">Loading deck insights.</p>;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold">Daily decks</h2>
      <p className="mt-2 text-muted-foreground">
        Counts are for the person who received the deck. Days with fewer than
        five decks are hidden. Pass and like are not shown separately.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setFilters({
            from: String(data.get("from") ?? ""),
            to: String(data.get("to") ?? ""),
            faculty: String(data.get("faculty") ?? ""),
            year: String(data.get("year") ?? ""),
            gender: String(data.get("gender") ?? ""),
            relationshipGoal: String(data.get("relationshipGoal") ?? ""),
            onboarded: String(data.get("onboarded") ?? ""),
            paused: String(data.get("paused") ?? ""),
            interest: String(data.get("interest") ?? ""),
          });
        }}
      >
        <Field
          label="From"
          name="from"
          type="date"
          defaultValue={filters.from}
        />
        <Field label="To" name="to" type="date" defaultValue={filters.to} />
        <Field
          label="Faculty"
          name="faculty"
          defaultValue={filters.faculty}
          placeholder="engineering"
        />
        <Select
          label="Year"
          name="year"
          defaultValue={filters.year}
          options={["1", "2", "3", "4", "5", "6"].map((year) => [year, year])}
        />
        <Select
          label="Gender"
          name="gender"
          defaultValue={filters.gender}
          options={genders}
        />
        <Select
          label="Relationship goal"
          name="relationshipGoal"
          defaultValue={filters.relationshipGoal}
          options={relationshipGoals}
        />
        <Select
          label="Onboarding"
          name="onboarded"
          defaultValue={filters.onboarded}
          options={[
            ["onboarded", "Onboarded"],
            ["not-onboarded", "Not onboarded"],
          ]}
        />
        <Select
          label="Account"
          name="paused"
          defaultValue={filters.paused}
          options={[
            ["active", "Active"],
            ["paused", "Paused now"],
          ]}
        />
        <Field
          label="Interest tag"
          name="interest"
          defaultValue={filters.interest}
          placeholder="one tag"
        />
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Loading…" : "Apply filters"}
          </Button>
        </div>
      </form>
      {error ? (
        <p className="mt-4 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && insights ? <DeckCharts insights={insights} /> : null}
    </section>
  );
}

function DeckCharts({ insights }: { insights: DailyDeckInsights }) {
  return (
    <div className="mt-6 grid gap-6">
      <Chart
        title="Decks generated"
        points={insights.days.map((day) => ({
          date: day.date,
          value: day.decksGenerated,
        }))}
      />
      <Chart
        title="Total candidate slots"
        points={insights.days.map((day) => ({
          date: day.date,
          value: day.totalCandidateSlots,
        }))}
      />
      <Chart
        title="Average deck size"
        points={insights.days.map((day) => ({
          date: day.date,
          value: day.averageDeckSize,
        }))}
        format={formatDecimal}
      />
      <Chart
        title="Completed decks"
        points={insights.days.map((day) => ({
          date: day.date,
          value: day.completedDecks,
        }))}
      />
      <Chart
        title="Completion rate"
        points={insights.days.map((day) => ({
          date: day.date,
          value: day.completionRate * 100,
        }))}
        format={(value) => `${formatDecimal(value)}%`}
      />
      <div className="overflow-x-auto" hidden={insights.days.length === 0}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Daily deck counts</caption>
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Decks</th>
              <th className="py-2 pr-3 font-medium">Slots</th>
              <th className="py-2 pr-3 font-medium">Average size</th>
              <th className="py-2 pr-3 font-medium">Completed</th>
              <th className="py-2 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody>
            {insights.days.map((day) => (
              <tr key={day.date} className="border-b">
                <td className="py-2 pr-3">{day.date}</td>
                <td className="py-2 pr-3">{day.decksGenerated}</td>
                <td className="py-2 pr-3">{day.totalCandidateSlots}</td>
                <td className="py-2 pr-3">
                  {formatDecimal(day.averageDeckSize)}
                </td>
                <td className="py-2 pr-3">{day.completedDecks}</td>
                <td className="py-2">
                  {formatDecimal(day.completionRate * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chart({
  title,
  points,
  format = (value: number) => String(Math.round(value)),
}: {
  title: string;
  points: { date: string; value: number }[];
  format?: (value: number) => string;
}) {
  const peak = Math.max(...points.map((point) => point.value), 1);
  const width = points.length * 48;
  return (
    <figure>
      <figcaption className="font-medium">{title}</figcaption>
      {points.length === 0 ? (
        <div
          className="relative mt-2 flex h-36 items-center justify-center text-sm text-muted-foreground"
          role="img"
          aria-label={`${title}: no data available`}
        >
          <svg
            className="absolute inset-0 h-full w-full stroke-border"
            aria-hidden="true"
          >
            {["12.5%", "37.5%", "62.5%"].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100%"
                y1={y}
                y2={y}
                strokeDasharray="4 4"
              />
            ))}
            <line x1="0" x2="100%" y1="87.5%" y2="87.5%" />
          </svg>
          <span className="relative bg-background px-3">No data</span>
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} 140`}
            className="h-36"
            style={{ width }}
            role="img"
            aria-label={title}
          >
            {points.map((point, index) => {
              const height = (point.value / peak) * 96;
              return (
                <g key={point.date} transform={`translate(${index * 48 + 8} 0)`}>
                  <rect
                    x="8"
                    y={112 - height}
                    width="24"
                    height={height}
                    rx="4"
                    className="fill-primary"
                  />
                  <text
                    x="20"
                    y="128"
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    {point.date.slice(5)}
                  </text>
                  <title>{`${point.date}: ${format(point.value)}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </figure>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="h-9 rounded-lg border bg-background px-2"
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select
        className="h-9 rounded-lg border bg-background px-2"
        name={name}
        defaultValue={defaultValue}
      >
        <option value="">Any</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function queryString(filters: Filters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value,
  );
}
