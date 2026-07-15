"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Gamepad2 } from "lucide-react";
import type { Friend, Game } from "@/lib/types";

const FRIENDS_LIMIT = 100;

export function FriendsComparison({
  initialFriends,
  games,
}: {
  initialFriends: Friend[];
  games: Game[];
}) {
  const gamesWithAchievements = games.filter((g) => g.achievements.total > 0);
  const topGame = gamesWithAchievements[0];
  const [selectedAppId, setSelectedAppId] = useState<string>(
    topGame ? String(topGame.appId) : "",
  );
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedAppId) return;
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          appId: selectedAppId,
          limit: String(FRIENDS_LIMIT),
        });
        const res = await fetch(`/api/friends-comparison?${params.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { friends: Friend[] };
        setFriends(data.friends);
      } catch {
        // keep last good data
      }
    });
  }, [selectedAppId]);

  function onGameChange(value: string | null) {
    if (!value) return;
    setSelectedAppId(value);
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Friends Comparison
        </CardTitle>
        {gamesWithAchievements.length > 0 && (
          <Select value={selectedAppId} onValueChange={onGameChange}>
            <SelectTrigger className="h-8 w-50 border-border/50 bg-background text-xs">
              <SelectValue placeholder="Select a game" />
            </SelectTrigger>
            <SelectContent>
              {gamesWithAchievements.slice(0, 20).map((game) => (
                <SelectItem key={game.appId} value={String(game.appId)}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {gamesWithAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Gamepad2 className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">
                No games with achievements
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Play some games to compare with friends.
              </p>
            </div>
          </div>
        ) : isPending ? (
          <div className="space-y-4">
            {Array.from({ length: FRIENDS_LIMIT }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">
                No friends to compare
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add friends on Steam to see how you stack up.
              </p>
            </div>
          </div>
        ) : (
          <>
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border/50">
                  {friend.avatar && <AvatarImage src={friend.avatar} />}
                  <AvatarFallback>
                    {friend.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span
                      className={
                        friend.isYou
                          ? "font-medium text-primary"
                          : "text-foreground"
                      }
                    >
                      {friend.name}
                    </span>
                    <span className="font-semibold text-foreground">
                      {friend.percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        friend.isYou ? "bg-primary" : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${friend.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
