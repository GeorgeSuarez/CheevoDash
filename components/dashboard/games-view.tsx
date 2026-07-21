"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import Image from "next/image";
import Link from "next/link";
import { Search, Clock, Trophy, Bookmark, Gamepad2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Game } from "@/lib/types";

type SortKey = "playtime" | "completion" | "achievements" | "name";

function CompletionRing({
  value,
  size = 40,
  strokeWidth = 4,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        role="img"
        aria-label={`${value}% completion`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold tabular-nums text-foreground">
          {value}%
        </span>
      </div>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.appId}`}
      className="group relative block overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-border"
    >
      <div className="relative aspect-[460/215] w-full overflow-hidden">
        <Image
          src={game.image}
          alt={game.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        {game.tracked && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/90">
            <Bookmark className="h-3 w-3 fill-primary-foreground text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {game.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {game.hours}h
              </span>
              {game.achievements.total > 0 && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {game.achievements.earned}/{game.achievements.total}
                </span>
              )}
            </div>
          </div>
          {game.achievements.total > 0 && (
            <CompletionRing value={game.completion} />
          )}
        </div>
        {game.achievements.total > 0 && (
          <div className="mt-3">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={game.completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${game.completion}% completion`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${game.completion}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export function GamesView({
  games,
  user,
}: {
  games: Game[];
  user?: { personaName: string; avatar: string };
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("playtime");

  const filteredGames = useMemo(() => {
    let result = [...games];

    if (filter === "tracked") {
      result = result.filter((g) => g.tracked);
    } else if (filter === "owned") {
      result = result.filter((g) => g.owned);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }

    switch (sort) {
      case "playtime":
        result.sort((a, b) => b.hours - a.hours);
        break;
      case "completion":
        result.sort((a, b) => b.completion - a.completion);
        break;
      case "achievements":
        result.sort(
          (a, b) => b.achievements.earned - a.achievements.earned,
        );
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [games, search, filter, sort]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={user} activeHref="/games" />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar user={user} activeHref="/games" />
            <h2 className="text-xl font-bold text-foreground">Games</h2>
          </div>

          {/* Header */}
          <div className="pb-6">
            <h2 className="hidden text-2xl font-bold text-foreground lg:block" aria-hidden>
              Your Library
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {games.length} game{games.length !== 1 ? "s" : ""} in your Steam
              library
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/50 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
                <SelectTrigger className="h-9 w-36 border-border/50 bg-card text-xs">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="tracked">Tracked</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as SortKey)}
              >
                <SelectTrigger className="h-9 w-40 border-border/50 bg-card text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playtime">Most Played</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="achievements">Achievements</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Game grid */}
          {filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/30 bg-card/50 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Gamepad2 className="h-7 w-7 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {search ? "No games match your search" : "No games to show"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search
                    ? `Try a different search term`
                    : "Try changing the filter to see more games."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
