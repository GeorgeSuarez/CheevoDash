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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Gamepad2, label: "Games" },
  { icon: Trophy, label: "Achievements" },
  { icon: GitCompare, label: "Comparisons" },
  { icon: Users, label: "Friends" },
  { icon: BarChart3, label: "Insights" },
  { icon: Settings, label: "Settings" },
];

export function SidebarContent() {
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

      <div className="flex flex-col">
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

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  );
}
