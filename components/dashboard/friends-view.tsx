"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, GitCompare, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { FriendSummary } from "@/lib/dashboard";
import type { DashboardError } from "@/lib/types";

export function FriendsView({
  friends,
  error,
}: {
  friends: FriendSummary[];
  error: DashboardError;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar activeHref="/friends" />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar activeHref="/friends" />
            <h2 className="text-xl font-bold text-foreground">Friends</h2>
          </div>

          {/* Header */}
          <div className="pb-6">
            <h2 className="hidden text-2xl font-bold text-foreground lg:block">
              Friends
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {friends.length} friend{friends.length !== 1 ? "s" : ""} on Steam
            </p>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="font-semibold text-foreground">
                Couldn&apos;t fetch your friends list
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure your Steam friends list is set to public.
              </p>
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/30 bg-card/50 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No friends found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add friends on Steam to see them here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {friends.map((friend) => (
                <div
                  key={friend.steamId}
                  className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-border/50">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>
                        {friend.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {friend.name}
                      </p>
                      <a
                        href={friend.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        View profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <Link
                    href={`/friends/${friend.steamId}`}
                    className="w-full"
                  >
                    <Button
                      variant="secondary"
                      className="w-full gap-2 text-xs"
                    >
                      <GitCompare className="h-4 w-4" />
                      Compare stats
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
