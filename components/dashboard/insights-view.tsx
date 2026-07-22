"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { InsightsCards } from "@/components/dashboard/insights-cards";
import type { DashboardData } from "@/lib/types";

export function InsightsView({ initialData }: { initialData: DashboardData }) {
  const data = initialData;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={data.user} activeHref="/insights" />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar user={data.user} activeHref="/insights" />
            <h2 className="text-xl font-bold text-foreground">Insights</h2>
          </div>

          {/* Header */}
          <div className="pb-6">
            <h2 className="hidden text-2xl font-bold text-foreground lg:block">
              Insights
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Detailed achievement progress and trends over time.
            </p>
          </div>

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
            <>
              <StatsCards stats={data.stats} />
              <InsightsCards data={data} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
