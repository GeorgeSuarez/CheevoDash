"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
const AchievementChart = dynamic(
  () => import("@/components/dashboard/achievement-chart").then((m) => m.AchievementChart),
  { ssr: false },
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import type { DashboardData, DateRange } from "@/lib/types";

export function InsightsView({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [range, setRange] = useState<DateRange>("30d");
  const [isPending, startTransition] = useTransition();

  function refetch(nextRange: DateRange) {
    startTransition(async () => {
      const params = new URLSearchParams({ filter: "all", range: nextRange });
      try {
        const res = await fetch(`/api/dashboard?${params.toString()}`);
        if (!res.ok) return;
        const next = (await res.json()) as DashboardData;
        setData(next);
      } catch {
        // keep last good data on error
      }
    });
  }

  function onRangeChange(value: DateRange | null) {
    if (!value) return;
    setRange(value);
    refetch(value);
  }

  const totalAchievements = data.games.reduce(
    (sum, g) => sum + g.achievements.total,
    0,
  );

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={data.user} activeHref="/insights" />
      <main
        className="flex-1 overflow-auto bg-background p-4 lg:p-8"
        aria-busy={isPending}
      >
        <div className="mx-auto max-w-7xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar user={data.user} activeHref="/insights" />
            <h2 className="text-xl font-bold text-foreground">Insights</h2>
          </div>

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-start">
            <div>
              <h2 className="hidden text-2xl font-bold text-foreground lg:block">
                Insights
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Detailed achievement progress and trends over time.
              </p>
            </div>
            <Select value={range} onValueChange={onRangeChange}>
              <SelectTrigger className="h-9 w-36 border-border/50 bg-card text-xs">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="30 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dashboard content */}
          {data.error ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <p className="font-semibold text-foreground">
                Couldn&apos;t fetch your Steam data
              </p>
              <p className="text-sm text-muted-foreground">
                Steam API returned status {data.error.status ?? "(network error)"}.
              </p>
            </div>
          ) : (
            <div className="relative">
              {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating data...
                  </div>
                </div>
              )}
              <div className={isPending ? "pointer-events-none opacity-50" : "transition-opacity duration-200"}>
                <StatsCards stats={data.stats} />

                <div className="mt-6">
                  <AchievementChart
                    series={data.achievementSeries}
                    totalAchievements={totalAchievements}
                    games={data.games}
                    range={range}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
