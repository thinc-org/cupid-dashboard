"use client";

import { useEffect, useState } from "react";
import { DailyDeckInsightsPanel } from "@/components/daily-deck-insights";
import { Button } from "@/components/ui/button";
import {
  defaultInsightsFilters,
  type InsightsFilters,
} from "@/lib/insights/filters";
import { AudiencePanel } from "./audience-panel";
import { GlobalFilterBar } from "./global-filter-bar";

type DashboardTab = "audience" | "daily-decks";

const isDev = process.env.NODE_ENV !== "production";

export function InsightsDashboard() {
  const [filters, setFilters] = useState<InsightsFilters | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("audience");
  const [visitedDailyDecks, setVisitedDailyDecks] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [decksLoading, setDecksLoading] = useState(false);
  const [useDevMock, setUseDevMock] = useState(false);

  useEffect(() => {
    setFilters(defaultInsightsFilters());
  }, []);

  if (!filters) {
    return <p className="mt-6 text-sm text-muted-foreground">Loading insights…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <GlobalFilterBar
        filters={filters}
        loading={audienceLoading || decksLoading}
        onApply={setFilters}
        showDevMockToggle={isDev && activeTab === "audience"}
        useDevMock={useDevMock}
        onToggleDevMock={setUseDevMock}
      />

      <div
        className="inline-flex rounded-xl border border-border bg-card p-1 shadow-[0_1px_2px_rgba(244,63,94,0.05)]"
        role="tablist"
        aria-label="Insight sections"
      >
        <Button
          type="button"
          role="tab"
          aria-selected={activeTab === "audience"}
          variant={activeTab === "audience" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("audience")}
        >
          Who is on the product
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={activeTab === "daily-decks"}
          variant={activeTab === "daily-decks" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setActiveTab("daily-decks");
            setVisitedDailyDecks(true);
          }}
        >
          Daily decks
        </Button>
      </div>

      <div role="tabpanel" hidden={activeTab !== "audience"}>
        <AudiencePanel
          filters={filters}
          useDevMock={useDevMock}
          onLoadingChange={setAudienceLoading}
        />
      </div>
      {visitedDailyDecks ? (
        <div role="tabpanel" hidden={activeTab !== "daily-decks"}>
          <DailyDeckInsightsPanel
            filters={filters}
            onLoadingChange={setDecksLoading}
          />
        </div>
      ) : null}
    </div>
  );
}
