import {
  Gamepad2,
  Trophy,
  Users,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  GitCompare,
  Bookmark,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/types";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Gamepad2, label: "Games" },
  { icon: Trophy, label: "Achievements" },
  { icon: GitCompare, label: "Comparisons" },
  { icon: Users, label: "Friends" },
  { icon: BarChart3, label: "Insights" },
  { icon: Settings, label: "Settings" },
];

const SIDEBAR_GAME_LIMIT = 6;

function SidebarGameList({ games }: { games: Game[] }) {
  const topGames = [...games]
    .filter((g) => g.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, SIDEBAR_GAME_LIMIT);

  if (topGames.length === 0) return null;

  return (
    <div className="mt-6 flex flex-col">
      <div className="mb-1 flex items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your Games
        </span>
        <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {games.length}
        </span>
      </div>
      <div className="mt-1 max-h-48 space-y-0.5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        {topGames.map((game) => (
          <a
            key={game.id}
            href="#"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
          >
            <div className="relative h-9 w-[52px] shrink-0 overflow-hidden rounded-md">
              <Image
                src={game.image}
                alt=""
                fill
                className="object-cover"
                sizes="52px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground transition-colors group-hover:text-sidebar-accent-foreground">
                {game.name}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {game.hours}h
                </span>
                {game.tracked && (
                  <Bookmark className="h-3 w-3 fill-primary text-primary" />
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function SidebarContent({
  user,
  games,
}: {
  user?: { personaName: string; avatar: string };
  games?: Game[];
}) {
  return (
    <div className="flex flex-col px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Gamepad2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight text-foreground">
            CheevoDash
          </h1>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dashboard
          </p>
        </div>
      </div>

      <nav aria-label="Primary" className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </a>
        ))}
      </nav>

      {games && <SidebarGameList games={games} />}

      <div className="mt-auto flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.personaName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.personaName}</p>
            </div>
          </div>
        )}
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({
  user,
  games,
}: {
  user?: { personaName: string; avatar: string };
  games?: Game[];
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <SidebarContent user={user} games={games} />
    </aside>
  );
}
