import { Skeleton } from "@/components/ui/skeleton";

export default function FriendCompareLoading() {
  return (
    <div className="flex min-h-screen w-full">
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
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Skeleton className="mb-6 h-4 w-32" />

          {/* VS header */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-10" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <Skeleton className="mb-4 h-5 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-t border-border/30 py-3 first:border-t-0">
                  <Skeleton className="mb-2 h-3 w-24" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <Skeleton className="mb-4 h-5 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-t border-border/30 py-3 first:border-t-0">
                  <Skeleton className="mb-2 h-3 w-24" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
