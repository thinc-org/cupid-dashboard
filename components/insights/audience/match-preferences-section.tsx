import type { MatchFilterInsights } from "@/lib/insights/audience";
import { ChartCard } from "../chart-card";
import { MetricList } from "../charts/metric-list";
import { toLabeled } from "./audience-summary";

export function MatchPreferencesSection({
  matchFilters,
}: {
  matchFilters: MatchFilterInsights;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Match filter preferences
        </h3>
        <p className="text-xs text-muted-foreground">
          Counts each preference selected; empty lists appear as &ldquo;No
          restrictions (Open Deck)&rdquo;.
        </p>
      </div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <ChartCard
          title="Preferred faculties"
          empty={matchFilters.faculties.length === 0}
        >
          <MetricList items={toLabeled("faculty", matchFilters.faculties)} />
        </ChartCard>
        <ChartCard
          title="Preferred years"
          empty={matchFilters.years.length === 0}
        >
          <MetricList items={toLabeled("year", matchFilters.years)} />
        </ChartCard>
        <ChartCard
          title="Preferred gender interest"
          empty={matchFilters.genderInterest.length === 0}
        >
          <MetricList
            items={toLabeled("gender", matchFilters.genderInterest)}
          />
        </ChartCard>
        <ChartCard
          title="Preferred relationship goals"
          empty={matchFilters.relationshipGoals.length === 0}
        >
          <MetricList
            items={toLabeled(
              "relationshipGoal",
              matchFilters.relationshipGoals,
            )}
          />
        </ChartCard>
      </div>
    </section>
  );
}
