"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, EyeOff } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DashboardData } from "@/lib/types";
import type { FriendSummary } from "@/lib/dashboard";

function StatCard({
  label,
  yourValue,
  friendValue,
  format,
}: {
  label: string;
  yourValue: number | string;
  friendValue: number | string;
  format?: "number" | "percent";
}) {
  const yourNum = typeof yourValue === "number" ? yourValue : Number(yourValue);
  const friendNum = typeof friendValue === "number" ? friendValue : Number(friendValue);
  const youWin = yourNum > friendNum;
  const tie = yourNum === friendNum;

  return (
    <div className="border-t border-border/30 py-3 first:border-t-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!tie && (
            <span className={youWin ? "text-green-400" : "text-muted-foreground/50"}>
              {youWin ? "▲" : "▼"}
            </span>
          )}
          <span className={youWin ? "font-semibold text-foreground" : "text-muted-foreground/70"}>
            {format === "percent" ? `${yourValue}%` : yourValue}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">vs</span>
        <div className="flex items-center gap-2">
          <span className={!youWin && !tie ? "font-semibold text-foreground" : "text-muted-foreground/70"}>
            {format === "percent" ? `${friendValue}%` : friendValue}
          </span>
          {!tie && (
            <span className={!youWin ? "text-green-400" : "text-muted-foreground/50"}>
              {!youWin ? "▲" : "▼"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FriendCompareView({
  yourData,
  friendData,
  friendInfo,
}: {
  yourData: DashboardData;
  friendData: DashboardData;
  friendInfo?: FriendSummary;
}) {
  const friendName = friendInfo?.name ?? friendData.user?.personaName ?? "Friend";
  const friendAvatar = friendInfo?.avatar ?? friendData.user?.avatar ?? "";

  if (yourData.error || friendData.error) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar activeHref="/friends" />
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/friends"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to friends
            </Link>
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              {yourData.error?.type === "private_profile" || friendData.error?.type === "private_profile" ? (
                <>
                  <EyeOff className="h-8 w-8 text-destructive" />
                  <p className="font-semibold text-foreground">
                    {friendData.error?.type === "private_profile"
                      ? `${friendName}'s profile is private`
                      : "Your profile is private"}
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <p className="font-semibold text-foreground">
                    Couldn&apos;t fetch data to compare
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const yourStats = yourData.stats;
  const friendStats = friendData.stats;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar activeHref="/friends" />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar activeHref="/friends" />
            <h2 className="text-xl font-bold text-foreground">Compare</h2>
          </div>

          {/* Back link */}
          <Link
            href="/friends"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to friends
          </Link>

          {/* Compare header */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-16 w-16 border-2 border-primary">
                {yourData.user?.avatar && <AvatarImage src={yourData.user.avatar} />}
                <AvatarFallback>YOU</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold text-foreground">
                {yourData.user?.personaName ?? "You"}
              </p>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-16 w-16 border-2 border-muted-foreground">
                {friendAvatar && <AvatarImage src={friendAvatar} />}
                <AvatarFallback>
                  {friendName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold text-foreground">
                {friendName}
              </p>
            </div>
          </div>

          {/* Stats comparison */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  <span className="text-primary">{yourData.user?.personaName ?? "You"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <StatCard label="Achievements Earned" yourValue={yourStats.achievementsEarned} friendValue={friendStats.achievementsEarned} />
                <StatCard label="Avg Completion" yourValue={yourStats.avgCompletion} friendValue={friendStats.avgCompletion} format="percent" />
                <StatCard label="Games Owned" yourValue={yourStats.gamesOwned} friendValue={friendStats.gamesOwned} />
                <StatCard label="Perfect Games" yourValue={yourStats.perfectGames} friendValue={friendStats.perfectGames} />
                <StatCard label="Games Tracked" yourValue={yourStats.gamesTracked} friendValue={friendStats.gamesTracked} />
              </CardContent>
            </Card>

            {friendData.error ? (
              <Card className="border-border/50 bg-card">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <EyeOff className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    {friendName}&apos;s data unavailable
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Profile or game details may be private.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    <span className="text-muted-foreground">{friendName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <StatCard label="Achievements Earned" yourValue={friendStats.achievementsEarned} friendValue={yourStats.achievementsEarned} />
                  <StatCard label="Avg Completion" yourValue={friendStats.avgCompletion} friendValue={yourStats.avgCompletion} format="percent" />
                  <StatCard label="Games Owned" yourValue={friendStats.gamesOwned} friendValue={yourStats.gamesOwned} />
                  <StatCard label="Perfect Games" yourValue={friendStats.perfectGames} friendValue={yourStats.perfectGames} />
                  <StatCard label="Games Tracked" yourValue={friendStats.gamesTracked} friendValue={yourStats.gamesTracked} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
