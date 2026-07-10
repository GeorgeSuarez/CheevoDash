"use client";

import { useState, useTransition } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { AchievementChart } from "@/components/dashboard/achievement-chart";
import { ComparisonChart } from "@/components/dashboard/comparison-chart";
import { FriendsComparison } from "@/components/dashboard/friends-comparison";
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
      <Sidebar />
      <main
        className="flex-1 overflow-auto bg-background p-4 lg:p-8"
        aria-busy={isPending}
      >
        <div className="mx-auto max-w-7xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar />
            <h2 className="text-xl font-bold text-foreground">Overview</h2>
          </div>

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-start">
            <div>
              <h2 className="hidden text-2xl font-bold text-foreground lg:block">
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
                  <SelectItem value="All Games">All Games</SelectItem>
                  <SelectItem value="Owned Games">Owned Games</SelectItem>
                  <SelectItem value="Tracked Games">Tracked Games</SelectItem>
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
                {data.error === "private_profile" ? (
                  <EyeOff className="h-6 w-6 text-destructive" aria-hidden />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {data.error === "private_profile"
                    ? "Your Steam profile is private"
                    : "Couldn't fetch your Steam data"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.error === "private_profile"
                    ? "Set your profile and game details to public in Steam privacy settings, then refresh."
                    : "Steam's API may be rate-limiting or unavailable. Please try again in a moment."}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={
                isPending
                  ? "opacity-30 transition-opacity duration-200"
                  : "transition-opacity duration-200"
              }
            >
              <StatsCards stats={data.stats} />

              {/* Charts row */}
              <div className="mt-6 grid grid-cols-12 gap-6">
                <AchievementChart series={data.achievementSeries} />
                <div className="col-span-12 grid grid-cols-1 gap-6 lg:col-span-5">
                  <ComparisonChart comparison={data.comparison} />
                  <FriendsComparison
                    initialFriends={data.friends}
                    games={data.games}
                  />
                </div>
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
          )}
        </div>
      </main>
    </div>
  );
}
