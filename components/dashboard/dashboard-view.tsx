"use client";

import { useState, useTransition } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentAchievements } from "@/components/dashboard/recent-achievements";
import { TrackedGamesList } from "@/components/dashboard/tracked-games-list";
import { TopGames } from "@/components/dashboard/top-games";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Lightbulb, AlertTriangle, EyeOff } from "lucide-react";
import type { DashboardData, DateRange, GameFilter } from "@/lib/types";

export function DashboardView({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [filter, setFilter] = useState<GameFilter>("all");
  const [range, setRange] = useState<DateRange>("30d");
  const [isPending, startTransition] = useTransition();

  function refetch(nextFilter: GameFilter, nextRange: DateRange) {
    startTransition(async () => {
      const params = new URLSearchParams({
        filter: nextFilter,
        range: nextRange,
      });
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

  function onFilterChange(value: GameFilter | null) {
    if (!value) return;
    setFilter(value);
    refetch(value, range);
  }

  function onRangeChange(value: DateRange | null) {
    if (!value) return;
    setRange(value);
    refetch(filter, value);
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={data.user} activeHref="/" />
      <main
        className="flex-1 overflow-auto bg-background p-4 lg:p-8"
        aria-busy={isPending}
      >
        <div className="mx-auto max-w-7xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar user={data.user} activeHref="/" />
            <h2 className="text-xl font-bold text-foreground">Overview</h2>
          </div>

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-start">
            <div>
              <h2 className="hidden text-2xl font-bold text-foreground lg:block" aria-hidden>
                Overview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your achievements and compare your progress with other
                players.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select onValueChange={onFilterChange}>
                <SelectTrigger className="h-9 w-36 border-border/50 bg-card text-xs">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="owned">Owned Games</SelectItem>
                  <SelectItem value="tracked">Tracked Games</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          {/* Dashboard content */}
          {data.error ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                {data.error.type === "private_profile" ? (
                  <EyeOff className="h-6 w-6 text-destructive" aria-hidden />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {data.error.type === "private_profile"
                    ? "Your Steam profile is private"
                    : "Couldn't fetch your Steam data"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.error.type === "private_profile"
                    ? "Set your profile and game details to public in Steam privacy settings, then refresh."
                    : `Steam API returned status ${data.error.status ?? "(network error)"}. Ensure your STEAM_API_KEY is correct and set in Vercel env vars for Production.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating data...
                  </div>
                </div>
              )}
              <div className={isPending ? "pointer-events-none opacity-50" : "transition-opacity duration-200"}>
                <StatsCards stats={data.stats} />

              {/* Tracked games */}
              <div className="mt-6">
                <TrackedGamesList games={data.games} />
              </div>

              {/* Recent achievements */}
              <div className="mt-6">
                <RecentAchievements achievements={data.recentAchievements} />
              </div>

              {/* Top games */}
              <div className="mt-6">
                <TopGames
                  games={data.games}
                  onTrackToggle={() => refetch(filter, range)}
                />
              </div>

              {/* Notification banner */}
              <div className="mt-6 flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {data.stats.achievementsEarnedDelta != null &&
                    data.stats.achievementsEarnedDelta > 0
                      ? `Great job! You've earned ${data.stats.achievementsEarnedDelta} more achievements this month.`
                      : `You've earned ${data.stats.achievementsEarned.toLocaleString()} achievements total.`}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Keep playing to beat your community average!
                  </p>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
