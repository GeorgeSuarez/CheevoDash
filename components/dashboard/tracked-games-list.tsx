"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, BookmarkCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/lib/types";

export function TrackedGamesList({ games }: { games: Game[] }) {
  const tracked = useMemo(
    () =>
      [...games]
        .filter((g) => g.tracked)
        .sort((a, b) => b.hours - a.hours),
    [games],
  );

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Tracked Games
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {tracked.length} game{tracked.length !== 1 ? "s" : ""}
        </span>
      </CardHeader>
      <CardContent className="pt-2">
        {tracked.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookmarkCheck className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No tracked games</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Track games from the Top Games section to see them here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {tracked.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.appId}`}
                className="block py-3 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-4 px-4">
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={game.image}
                      alt={game.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {game.name}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {game.hours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {game.achievements.earned}/{game.achievements.total}
                      </span>
                      <span className="ml-auto font-semibold text-foreground">
                        {game.completion}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 px-4">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={game.completion}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${game.completion}% completion`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${game.completion}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
