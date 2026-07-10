"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, ArrowRight, ArrowUp, ArrowDown, Gamepad2, Bookmark, BookmarkCheck } from "lucide-react";
import Image from "next/image";
import type { Game } from "@/lib/types";

const TOP_GAMES_LIMIT = 4;

export function TopGames({
  games,
  onTrackToggle,
}: {
  games: Game[];
  onTrackToggle?: (appId: number, tracked: boolean) => void;
}) {
  const topGames = [...games]
    .sort((a, b) => b.hours - a.hours)
    .slice(0, TOP_GAMES_LIMIT);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Top Games</CardTitle>
        <Button
          variant="ghost"
          className="group h-auto p-0 text-sm font-medium text-primary hover:bg-transparent hover:text-primary/80"
        >
          View All Games
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {topGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Gamepad2 className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No games to show</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the filter to see more games.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <caption className="sr-only">
                Top games by playtime with completion, achievements, and community comparison
              </caption>
              <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-medium">Game</th>
                <th className="pb-3 font-medium">Completion</th>
                <th className="pb-3 font-medium">Achievements</th>
                <th className="pb-3 font-medium">Compare</th>
                <th className="pb-3 font-medium">Track</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {topGames.map((game) => (
                <TopGameRow
                  key={game.id}
                  game={game}
                  onTrackToggle={onTrackToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopGameRow({
  game,
  onTrackToggle,
}: {
  game: Game;
  onTrackToggle?: (appId: number, tracked: boolean) => void;
}) {
  const [tracked, setTracked] = useState(game.tracked);
  const [isPending, startTransition] = useTransition();

  function toggleTrack() {
    const nextTracked = !tracked;
    setTracked(nextTracked);
    startTransition(async () => {
      try {
        if (nextTracked) {
          await fetch("/api/tracked-games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appId: game.appId }),
          });
        } else {
          await fetch(
            `/api/tracked-games?appId=${game.appId}`,
            { method: "DELETE" },
          );
        }
        onTrackToggle?.(game.appId, nextTracked);
      } catch {
        setTracked(!nextTracked);
      }
    });
  }

  return (
    <tr
      key={game.id}
      className="border-t border-border/30 transition-colors hover:bg-white/[0.02]"
    >
      <td className="py-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={game.image}
              alt={game.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">{game.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {game.hours} hrs
            </p>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="w-32">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {game.completion}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${game.completion}%` }}
            />
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="flex items-center gap-2 text-foreground">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{game.achievements.earned}</span>
          <span className="text-muted-foreground">
            / {game.achievements.total}
          </span>
        </div>
      </td>
      <td className="py-4">
        <p className="flex items-center gap-1.5 text-foreground">
          {game.comparison.isPositive ? (
            <ArrowUp className="h-4 w-4 text-green-400" aria-hidden />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-400" aria-hidden />
          )}
          <span>
            {game.comparison.text}{" "}
            <span
              className={
                game.comparison.isPositive
                  ? "font-semibold text-green-400"
                  : "font-semibold text-red-400"
              }
            >
              {game.comparison.percent}%
            </span>{" "}
            <span className="text-muted-foreground">of players</span>
          </span>
        </p>
      </td>
      <td className="py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTrack}
          disabled={isPending}
          aria-label={tracked ? `Untrack ${game.name}` : `Track ${game.name}`}
          aria-pressed={tracked}
          className={
            tracked
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          {tracked ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          <span className="ml-1.5 text-xs">
            {tracked ? "Tracked" : "Track"}
          </span>
        </Button>
      </td>
    </tr>
  );
}
