import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { userPreferences } from "./db/schema";
import { DASHBOARD_FILTERS, type GameFilter } from "./types";

export interface UserPreferences {
  defaultFilter: GameFilter;
}

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
        defaultFilter: row.defaultFilter,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { defaultFilter: "all" };
}

export async function savePreferences(
  steamId: string,
  prefs: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const filter =
    prefs.defaultFilter && DASHBOARD_FILTERS.includes(prefs.defaultFilter)
      ? prefs.defaultFilter
      : null;

  if (filter) {
    try {
      await getDb()
        .insert(userPreferences)
        .values({ steamId, defaultFilter: filter })
        .onConflictDoUpdate({
          target: userPreferences.steamId,
          set: { defaultFilter: filter },
        });
    } catch {
      // fall through
    }
  }

  return getPreferences(steamId);
}
