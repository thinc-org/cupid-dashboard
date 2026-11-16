import { Badge } from "@/components/ui/badge";
import type { AudienceInsights } from "@/lib/insights/audience";
import { ChartCard } from "../chart-card";
import { VerticalBarChart } from "../charts/bar-chart";
import { HorizontalBarList } from "../charts/horizontal-bar-list";
import { SegmentedBar } from "../charts/segmented-bar";
import { TagPills } from "../charts/tag-pills";
import { formatDecimal } from "../formatters";
import { buildBucketBarProps, toLabeled } from "./audience-summary";

export function AudienceDemographicsSection({
  insights,
}: {
  insights: AudienceInsights;
}) {
  return (
    <section className="grid items-start gap-6 lg:grid-cols-12">
      <ChartCard
        className="lg:col-span-6"
        title="Academic standing (Year)"
        empty={insights.year.length === 0}
      >
        <VerticalBarChart
          title="Academic standing by year"
          showValues
          emptyMessage="No study years meet the minimum bucket size of 5."
          {...buildBucketBarProps(insights.year, "year")}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Age distribution bands"
        description="Grouped into age ranges."
        headerAction={
          insights.ageBands.medianAge !== null ? (
            <Badge variant="soft" className="tabular-nums">
              Median: {formatDecimal(insights.ageBands.medianAge)} yrs
            </Badge>
          ) : null
        }
        empty={insights.ageBands.buckets.length === 0}
      >
        <VerticalBarChart
          title="Age distribution bands"
          showValues
          emptyMessage="No age bands meet the minimum bucket size of 5."
          {...buildBucketBarProps(insights.ageBands.buckets, "ageBand")}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Gender identity breakdown"
        empty={insights.gender.length === 0}
      >
        <SegmentedBar items={toLabeled("gender", insights.gender)} />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Top interest tags"
        description="Counts each selected interest per person."
        empty={insights.interestTags.length === 0}
      >
        <TagPills items={toLabeled("interest", insights.interestTags)} />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Relationship goals & intent"
        empty={insights.relationshipGoal.length === 0}
      >
        <HorizontalBarList
          items={toLabeled("relationshipGoal", insights.relationshipGoal)}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Core value alignment"
        description="Counts each selected value per person."
        empty={insights.valueTags.length === 0}
      >
        <HorizontalBarList
          items={toLabeled("value", insights.valueTags)}
          ranked={false}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-12"
        title="Faculty breakdown"
        empty={insights.faculty.length === 0}
      >
        <HorizontalBarList items={toLabeled("faculty", insights.faculty)} />
      </ChartCard>
    </section>
  );
}
