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
      : undefined;

  const values: Partial<typeof userPreferences.$inferInsert> = {};
  if (filter) values.defaultFilter = filter;

  if (Object.keys(values).length === 0) {
    return getPreferences(steamId);
  }

  try {
    await getDb()
      .insert(userPreferences)
      .values({ steamId, ...values })
      .onConflictDoUpdate({
        target: userPreferences.steamId,
        set: values,
      });
  } catch {
    // fall through
  }

  return getPreferences(steamId);
}
