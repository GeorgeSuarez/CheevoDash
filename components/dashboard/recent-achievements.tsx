"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import Image from "next/image";
import type { RecentAchievement } from "@/lib/types";

function timeAgo(unix: number): string {
  const diff = Date.now() - unix * 1000;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function RecentAchievements({
  achievements,
}: {
  achievements: RecentAchievement[];
}) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Recent Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">
                No recent achievements
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Achievements you earn will appear here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {achievements.map((ach, i) => (
              <li
                key={`${ach.appId}-${ach.name}-${i}`}
                className="flex items-center gap-4 py-3"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {ach.icon ? (
                    <Image
                      src={ach.icon}
                      alt={ach.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {ach.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ach.gameName}
                  </p>
                  {ach.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">
                      {ach.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(ach.unlocktime)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
