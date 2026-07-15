import {
  Gamepad2,
  Trophy,
  Users,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  GitCompare,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/", active: true },
  { icon: Gamepad2, label: "Games", href: "/games" },
  { icon: Trophy, label: "Achievements", href: "#" },
  { icon: GitCompare, label: "Comparisons", href: "#" },
  { icon: Users, label: "Friends", href: "#" },
  { icon: BarChart3, label: "Insights", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

export function SidebarContent({
  user,
  activeHref = "/",
}: {
  user?: { personaName: string; avatar: string };
  activeHref?: string;
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
        {navItems.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

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
  activeHref,
}: {
  user?: { personaName: string; avatar: string };
  activeHref?: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <SidebarContent user={user} activeHref={activeHref} />
    </aside>
  );
}
