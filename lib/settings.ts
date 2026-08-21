import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { userPreferences } from "./db/schema";
import type { GameFilter, RarityTierConfig } from "./types";
import { DEFAULT_RARITY_TIERS } from "./types";
import { GAME_SORT_KEYS, type GameSortKey } from "./game-filtering";

export interface UserPreferences {
  defaultFilter: GameFilter;
  defaultSort: GameSortKey;
  hiddenAppIds: number[];
  rarityTiers: RarityTierConfig[] | null;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultFilter: "all",
  defaultSort: "playtime",
  hiddenAppIds: [],
  rarityTiers: null,
};

// --- Pure validators (exported for testing) ---

export function validateSortKey(value: unknown): GameSortKey | null {
  if (typeof value !== "string") return null;
  return (GAME_SORT_KEYS as string[]).includes(value)
    ? (value as GameSortKey)
    : null;
}

export function validateHiddenAppIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const ids: number[] = [];
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item) || item < 0) {
      return null;
    }
    ids.push(item);
  }
  return ids;
}

export function validateRarityTiers(
  value: unknown,
): RarityTierConfig[] | null {
  if (!Array.isArray(value) || value.length !== DEFAULT_RARITY_TIERS.length) {
    return null;
  }
  const tiers: RarityTierConfig[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const obj = item as Record<string, unknown>;
    if (
      typeof obj.tier !== "string" ||
      typeof obj.color !== "string" ||
      typeof obj.min !== "number" ||
      typeof obj.max !== "number"
    ) {
      return null;
    }
    if (obj.min < 0 || obj.max > 100.1 || obj.min >= obj.max) return null;
    tiers.push({
      tier: obj.tier,
      min: obj.min,
      max: obj.max,
      color: obj.color,
    });
  }
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].max !== tiers[i - 1].min) return null;
  }
  return tiers;
}

function parseJsonArray(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// --- Persistence ---

export async function getPreferences(
  steamId: string,
): Promise<UserPreferences> {
  try {
    const rows = await getDb()
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.steamId, steamId))
      .limit(1);
    if (rows.length > 0) {
      const row = rows[0];
      return {
        defaultFilter: (row.defaultFilter as GameFilter) ?? "all",
        defaultSort:
          validateSortKey(row.defaultSort) ?? DEFAULT_PREFERENCES.defaultSort,
        hiddenAppIds:
          validateHiddenAppIds(parseJsonArray(row.hiddenAppIds)) ??
          DEFAULT_PREFERENCES.hiddenAppIds,
        rarityTiers: validateRarityTiers(parseJsonArray(row.rarityTiers)),
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_PREFERENCES };
}

export async function savePreferences(
  steamId: string,
  prefs: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const current = await getPreferences(steamId);

  const values: Record<string, string> = {};

  const validFilters: GameFilter[] = ["all", "owned", "tracked"];
  if (prefs.defaultFilter && validFilters.includes(prefs.defaultFilter)) {
    values.defaultFilter = prefs.defaultFilter;
  }

  const sort = validateSortKey(prefs.defaultSort);
  if (sort) values.defaultSort = sort;

  if (prefs.hiddenAppIds !== undefined) {
    const hidden = validateHiddenAppIds(prefs.hiddenAppIds);
    if (hidden) values.hiddenAppIds = JSON.stringify(hidden);
  }

  if (prefs.rarityTiers !== undefined) {
    const tiers =
      prefs.rarityTiers === null ? [] : validateRarityTiers(prefs.rarityTiers);
    if (tiers !== null) {
      values.rarityTiers = JSON.stringify(tiers);
    }
  }

  if (Object.keys(values).length === 0) {
    return current;
  }

  try {
    await getDb()
      .insert(userPreferences)
      .values({ steamId, ...values } as typeof userPreferences.$inferInsert)
      .onConflictDoUpdate({
        target: userPreferences.steamId,
        set: values,
      });
  } catch {
    // fall through
  }

  return getPreferences(steamId);
}
