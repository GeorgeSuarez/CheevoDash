"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2 } from "lucide-react";
import type { UserPreferences } from "@/lib/settings";
import type { DateRange, GameFilter } from "@/lib/types";

const FILTER_OPTIONS: { value: GameFilter; label: string }[] = [
  { value: "all", label: "All Games" },
  { value: "owned", label: "Owned Games" },
  { value: "tracked", label: "Tracked Games" },
];

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
];

export function SettingsView({
  initialPrefs,
}: {
  initialPrefs: UserPreferences;
}) {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar activeHref="/settings" />
      <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-3xl">
          {/* Mobile top bar */}
          <div className="-mx-4 mb-4 flex items-center gap-3 lg:hidden">
            <MobileSidebar activeHref="/settings" />
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
          </div>

          {/* Header */}
          <div className="pb-6">
            <h2 className="hidden text-2xl font-bold text-foreground lg:block">
              Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your dashboard preferences.
            </p>
          </div>

          {/* Dashboard defaults */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Dashboard Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              <fieldset>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Default Game Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setPrefs((p) => ({ ...p, defaultFilter: opt.value }))
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        prefs.defaultFilter === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Default Date Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setPrefs((p) => ({ ...p, defaultRange: opt.value }))
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        prefs.defaultRange === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
