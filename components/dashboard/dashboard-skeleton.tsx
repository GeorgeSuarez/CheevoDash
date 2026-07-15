import { Skeleton } from "@/components/ui/skeleton";

function SidebarSkeleton() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <nav className="mt-2 flex flex-col gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </nav>
      <div className="mt-auto">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </aside>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-12 gap-6">
      <div className="col-span-12 rounded-xl border border-border/50 bg-card p-6 lg:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </div>
      <div className="col-span-12 grid grid-cols-1 gap-6 lg:col-span-5">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <Skeleton className="mb-4 h-5 w-44" />
          <Skeleton className="mx-auto h-[220px] max-w-[220px] rounded-full" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopGamesSkeleton() {
  return (
    <div className="mt-6 rounded-xl border border-border/50 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-14 w-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-2 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div>
      <StatsSkeleton />
      <ChartsSkeleton />
      <TopGamesSkeleton />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <SidebarSkeleton />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-start">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
          </div>
          <DashboardContentSkeleton />
        </div>
      </main>
    </div>
  );
}
