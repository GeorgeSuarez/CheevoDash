"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Award, Gamepad2, AlertTriangle, EyeOff } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AchievementsOverviewData } from "@/lib/dashboard";

function timeAgo(unix: number): string {
  if (unix === 0) return "";
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AchievementRow({
  achievement,
  showGame = true,
  showPercent = false,
}: {
  achievement: AchievementsOverviewData["recentAchievements"][number];
  showGame?: boolean;
  showPercent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-border/30 py-3 transition-colors hover:bg-white/[0.02]">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
        {achievement.icon ? (
          <Image
            src={achievement.icon}
            alt={achievement.name}
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
        <p className="truncate font-semibold text-foreground">{achievement.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {showGame && achievement.gameName}
          {showGame && showPercent && achievement.globalPercent != null && " · "}
          {showPercent && achievement.globalPercent != null && `${achievement.globalPercent.toFixed(1)}% of players`}
          {!showGame && achievement.globalPercent != null && `${achievement.globalPercent.toFixed(1)}% of players`}
        </p>
        {achievement.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">{achievement.description}</p>
        )}
      </div>
      {achievement.unlocktime > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(achievement.unlocktime)}</span>
      )}
    </div>
  );
}

export function AchievementsOverview({ data }: { data: AchievementsOverviewData }) {
  const { stats, games, recentAchievements, rarestAchievements, rarestPerGame } = data;

  const gamesWithAch = games.filter((g) => g.achievements.total > 0);
  const completedGames = gamesWithAch.filter((g) => g.achievements.earned >= g.achievements.total);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={data.user} activeHref="/achievements" />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar user={data.user} activeHref="/achievements" />
            <h2 className="text-xl font-bold text-foreground">Achievements</h2>
          </div>

          {/* Header */}
          <div className="pb-6">
            <h2 className="hidden text-2xl font-bold text-foreground lg:block">
              Achievements
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.achievementsEarned.toLocaleString()} earned across {gamesWithAch.length} game{gamesWithAch.length !== 1 ? "s" : ""}
            </p>
          </div>

          {data.error ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                {data.error.type === "private_profile" ? (
                  <EyeOff className="h-6 w-6 text-destructive" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <p className="font-semibold text-foreground">
                {data.error.type === "private_profile"
                  ? "Your Steam profile is private"
                  : "Couldn't fetch your Steam data"}
              </p>
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total Earned" value={stats.achievementsEarned.toLocaleString()} sub={stats.achievementsEarnedDelta != null ? `+${stats.achievementsEarnedDelta} this month` : undefined} />
                <StatCard label="Avg Completion" value={`${stats.avgCompletion}%`} />
                <StatCard label="Perfect Games" value={completedGames.length} sub={completedGames.length === 1 ? "100% complete" : undefined} />
                <StatCard label="Games with Achievements" value={gamesWithAch.length} />
              </div>

              {/* Recent and Rarest */}
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-border/50 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Recently Unlocked
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {recentAchievements.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No achievements unlocked yet.
                      </p>
                    ) : (
                      recentAchievements.map((ach, i) => (
                        <AchievementRow key={`recent-${ach.appId}-${ach.name}-${i}`} achievement={ach} showPercent />
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Rarest Gems
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {rarestAchievements.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No rare achievements unlocked yet.
                      </p>
                    ) : (
                      rarestAchievements.map((ach, i) => (
                        <AchievementRow key={`rare-${ach.appId}-${ach.name}-${i}`} achievement={ach} showPercent />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Game-by-game table */}
              <Card className="mt-6 border-border/50 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Achievement Progress by Game
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {gamesWithAch.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                      <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                      <p className="font-medium text-foreground">No games with achievements</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="pb-3 font-medium">Game</th>
                            <th className="pb-3 font-medium">Achievements</th>
                            <th className="pb-3 font-medium">Completion</th>
                            <th className="pb-3 font-medium">Rarest</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {gamesWithAch.sort((a, b) => b.hours - a.hours).map((game) => {
                            const rarest = rarestPerGame.find((r) => r.appId === game.appId);
                            return (
                              <tr key={game.id} className="border-b border-border/20 transition-colors hover:bg-white/[0.02] last:border-b-0">
                                <td className="py-3 pr-4">
                                  <Link href={`/games/${game.appId}`} className="flex items-center gap-3">
                                    <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                                      <Image
                                        src={game.image}
                                        alt={game.name}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    </div>
                                    <span className="truncate font-medium text-foreground hover:text-primary">
                                      {game.name}
                                    </span>
                                  </Link>
                                </td>
                                <td className="py-3 pr-4">
                                  <span className="flex items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-semibold text-foreground">{game.achievements.earned}</span>
                                    <span className="text-muted-foreground">/ {game.achievements.total}</span>
                                  </span>
                                </td>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-3">
                                    <span className="w-10 text-right font-semibold text-foreground">{game.completion}%</span>
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${game.completion}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3">
                                  {rarest ? (
                                    <div className="flex items-center gap-2">
                                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded bg-muted">
                                        {rarest.achievement.icon ? (
                                          <Image
                                            src={rarest.achievement.icon}
                                            alt={rarest.achievement.name}
                                            fill
                                            className="object-cover"
                                            sizes="24px"
                                          />
                                        ) : (
                                          <Award className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-xs text-foreground">{rarest.achievement.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {rarest.achievement.globalPercent?.toFixed(1)}% of players
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
