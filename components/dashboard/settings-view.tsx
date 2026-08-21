"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, X, Search, RotateCcw } from "lucide-react";
import {
  type UserPreferences,
} from "@/lib/settings";
import {
  DEFAULT_RARITY_TIERS,
  type GameFilter,
  type RarityTierConfig,
} from "@/lib/types";
import { type GameSortKey } from "@/lib/game-filtering";

const FILTER_OPTIONS: { value: GameFilter; label: string }[] = [
  { value: "all", label: "All Games" },
  { value: "owned", label: "Owned Games" },
  { value: "tracked", label: "Tracked Games" },
];

const SORT_OPTIONS: { value: GameSortKey; label: string }[] = [
  { value: "playtime", label: "Most Played" },
  { value: "completion", label: "Completion" },
  { value: "achievements", label: "Achievements" },
  { value: "name", label: "Name" },
];

const TIER_NAMES = [
  "Ultra Rare",
  "Very Rare",
  "Rare",
  "Uncommon",
] as const;

function defaultBoundaries(): number[] {
  return DEFAULT_RARITY_TIERS.slice(0, 4).map((t) => t.max);
}

function boundariesFromTiers(
  tiers: RarityTierConfig[] | null,
): number[] {
  if (!tiers) return defaultBoundaries();
  const byName = new Map(tiers.map((t) => [t.tier, t.max]));
  const boundaries = TIER_NAMES.map((name) => byName.get(name));
  if (boundaries.some((b) => typeof b !== "number")) {
    return defaultBoundaries();
  }
  return boundaries as number[];
}

function tiersFromBoundaries(boundaries: number[]): RarityTierConfig[] {
  const colors = [...DEFAULT_RARITY_TIERS]
    .reverse()
    .slice(0, 4)
    .map((t) => t.color);
  const [ultraRareMax, veryRareMax, rareMax, uncommonMax] = boundaries;
  return [
    { tier: "Ultra Rare", min: 0, max: ultraRareMax, color: colors[0] },
    { tier: "Very Rare", min: ultraRareMax, max: veryRareMax, color: colors[1] },
    { tier: "Rare", min: veryRareMax, max: rareMax, color: colors[2] },
    { tier: "Uncommon", min: rareMax, max: uncommonMax, color: colors[3] },
    {
      tier: "Common",
      min: uncommonMax,
      max: 100.1,
      color: DEFAULT_RARITY_TIERS[0].color,
    },
  ];
}

function boundariesAreValid(boundaries: number[]): boolean {
  return (
    boundaries.every(
      (b) => Number.isFinite(b) && b > 0 && b <= 100,
    ) &&
    boundaries.every((b, i) => i === 0 || b > boundaries[i - 1])
  );
}

export function SettingsView({
  initialPrefs,
  games = [],
}: {
  initialPrefs: UserPreferences;
  games?: { appId: number; name: string }[];
}) {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPrefs);
  const [boundaries, setBoundaries] = useState<number[]>(() =>
    boundariesFromTiers(initialPrefs.rarityTiers),
  );
  const [hiddenQuery, setHiddenQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rarityReset, setRarityReset] = useState(false);

  const tiersValid = boundariesAreValid(boundaries);
  const canSave = tiersValid;

  const searchResults = useMemo(() => {
    const query = hiddenQuery.trim().toLowerCase();
    if (!query) return [];
    const hidden = new Set(prefs.hiddenAppIds);
    return games
      .filter((g) => !hidden.has(g.appId))
      .filter((g) => g.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [hiddenQuery, games, prefs.hiddenAppIds]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const next: UserPreferences = {
        ...prefs,
        rarityTiers: rarityReset ? null : tiersFromBoundaries(boundaries),
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setPrefs(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function toggleHidden(appId: number) {
    setPrefs((p) => ({
      ...p,
      hiddenAppIds: p.hiddenAppIds.includes(appId)
        ? p.hiddenAppIds.filter((id) => id !== appId)
        : [...p.hiddenAppIds, appId],
    }));
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
                  Default Sort Order
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setPrefs((p) => ({ ...p, defaultSort: opt.value }))
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        prefs.defaultSort === opt.value
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
                  disabled={saving || !canSave}
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

          {/* Hidden games */}
          <Card className="mt-6 border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Hidden Games
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Hidden games are removed from your library views but still
                count toward lifetime stats.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {prefs.hiddenAppIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prefs.hiddenAppIds.map((appId) => {
                    const game = games.find((g) => g.appId === appId);
                    return (
                      <span
                        key={appId}
                        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1 text-sm text-foreground"
                      >
                        {game?.name ?? `App ${appId}`}
                        <button
                          type="button"
                          onClick={() => toggleHidden(appId)}
                          aria-label={`Unhide ${game?.name ?? appId}`}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search games to hide..."
                  value={hiddenQuery}
                  onChange={(e) => setHiddenQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/50 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              {searchResults.length > 0 && (
                <ul className="divide-y divide-border/30 overflow-hidden rounded-lg border border-border/50">
                  {searchResults.map((game) => (
                    <li key={game.appId}>
                      <button
                        type="button"
                        onClick={() => {
                          toggleHidden(game.appId);
                          setHiddenQuery("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/40"
                      >
                        <span className="truncate">{game.name}</span>
                        <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                          Hide
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Rarity tiers */}
          <Card className="mt-6 border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Rarity Tiers
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Set the global unlock percentage where each tier begins.
                Boundaries must increase from Ultra Rare to Common.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TIER_NAMES.map((name, i) => (
                  <label key={name} className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {name} below %
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={0.5}
                      value={boundaries[i]}
                      onChange={(e) => {
                        const next = [...boundaries];
                        next[i] = Number(e.target.value);
                        setBoundaries(next);
                        setRarityReset(false);
                      }}
                      aria-label={`${name} upper boundary`}
                      className="h-9 w-full rounded-lg border border-border/50 bg-background px-3 text-sm tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  </label>
                ))}
              </div>
              {!tiersValid && (
                <p className="text-sm text-destructive" role="alert">
                  Boundaries must be increasing numbers between 0 and 100.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setBoundaries(defaultBoundaries());
                  setPrefs((p) => ({ ...p, rarityTiers: null }));
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
