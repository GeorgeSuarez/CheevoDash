import { and, eq, lt, desc } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "./db/client";
import { isNumber } from "./decode";
import {
  librarySnapshots,
  snapshots,
  trackedGames,
  users,
} from "./db/schema";
import {
  getFriendList,
  getGameHeaderImage,
  getGlobalAchievementPercentages,
  getOwnedGames,
  getPlayerAchievements,
  getPlayerSummaries,
  getSchemaForGame,
} from "./steam";
import type {
  DashboardData,
  DashboardError,
  Game,
  GameAchievement,
  GameFilter,
  RarityTier,
  RecentAchievement,
  Stats,
  SteamGlobalAchievement,
} from "./types";

const CONCURRENCY = 5;

// --- Pure transforms (exported for testing) ---

export function filterGames(games: Game[], filter: GameFilter): Game[] {
  switch (filter) {
    case "owned":
      return games.filter((g) => g.owned);
    case "tracked":
      return games.filter((g) => g.tracked);
    default:
      return games;
  }
}

export function computeStats(games: Game[]): Stats {
  const gamesWithAchievements = games.filter((g) => g.achievements.total > 0);
  const achievementsEarned = games.reduce(
    (sum, g) => sum + (g.achievements.earned || 0),
    0,
  );
  const avgCompletion =
    gamesWithAchievements.length === 0
      ? 0
      : Math.round(
          (gamesWithAchievements.reduce(
            (sum, g) => sum + (g.completion || 0),
            0,
          ) /
            gamesWithAchievements.length) *
            10,
        ) / 10;

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentUnlocks = games.reduce(
    (sum, g) =>
      sum +
      (g.unlocktimes || []).filter((t) => t * 1000 >= thirtyDaysAgo).length,
    0,
  );

  return {
    achievementsEarned,
    achievementsEarnedDelta: recentUnlocks,
    avgCompletion: Number.isNaN(avgCompletion) ? 0 : avgCompletion,
    avgCompletionDelta: null,
    gamesOwned: games.filter((g) => g.owned).length,
    gamesOwnedDelta: null,
    gamesTracked: games.filter((g) => g.tracked).length,
    perfectGames: games.filter(
      (g) =>
        g.achievements.total > 0 &&
        g.achievements.earned >= g.achievements.total,
    ).length,
  };
}

export function meanGlobalPercent(
  percentages: SteamGlobalAchievement[],
): number {
  if (percentages.length === 0) return 0;
  const sum = percentages.reduce((acc, p) => acc + Number(p.percent), 0);
  const mean = Math.round((sum / percentages.length) * 10) / 10;
  return Number.isNaN(mean) ? 0 : mean;
}

// --- Concurrency-limited batch helper ---

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// --- Steam → Game mapping ---

interface GameData {
  achievements: { earned: number; total: number };
  unlocktimes: number[];
  communityAvg: number;
  earnedEntries: { apiname: string; unlocktime: number; globalPercent: number }[];
}

async function fetchGameData(
  steamId: string,
  appId: number,
): Promise<GameData> {
  const [playerAchievements, globalPercentages] = await Promise.all([
    getPlayerAchievements(steamId, appId),
    getGlobalAchievementPercentages(appId),
  ]);

  const earned = playerAchievements.filter((a) => a.achieved === 1).length;
  const total = playerAchievements.length;
  const unlocktimes = playerAchievements
    .filter((a) => a.achieved === 1 && a.unlocktime > 0)
    .map((a) => a.unlocktime);

  const globalPctMap = new Map<string, number>();
  for (const g of globalPercentages) {
    globalPctMap.set(g.name, Number(g.percent));
  }

  const earnedEntries = playerAchievements
    .filter((a) => a.achieved === 1 && a.unlocktime > 0)
    .map((a) => ({
      apiname: a.apiname,
      unlocktime: a.unlocktime,
      globalPercent: globalPctMap.get(a.apiname) ?? 0,
    }));

  return {
    achievements: { earned, total },
    unlocktimes,
    communityAvg: meanGlobalPercent(globalPercentages),
    earnedEntries,
  };
}

function buildGame(
  appId: number,
  name: string,
  playtimeMinutes: number,
  data: GameData,
): Game {
  const completion =
    data.achievements.total === 0
      ? 0
      : Math.round((data.achievements.earned / data.achievements.total) * 100);

  const safeCompletion = Number.isNaN(completion) ? 0 : completion;
  const safeCommunityAvg = Number.isNaN(data.communityAvg)
    ? 0
    : data.communityAvg;
  const isPositive = safeCompletion >= safeCommunityAvg;
  const communityPct = Math.round(safeCommunityAvg * 10) / 10;

  return {
    appId,
    name,
    hours: Math.round(playtimeMinutes / 60),
    completion: safeCompletion,
    achievements: data.achievements,
    comparison: {
      text: isPositive ? "You're ahead of" : "You're behind",
      percent: Number.isNaN(communityPct) ? 0 : communityPct,
      isPositive,
    },
    image: getGameHeaderImage(appId),
    owned: true,
    tracked: false,
    unlocktimes: data.unlocktimes,
  };
}

// --- Tracked games from DB ---

async function getTrackedAppIds(steamId: string): Promise<Set<number>> {
  try {
    const rows = await getDb()
      .select({ appId: trackedGames.appId })
      .from(trackedGames)
      .where(eq(trackedGames.steamId, steamId));
    return new Set(rows.map((r) => r.appId));
  } catch {
    return new Set();
  }
}

async function getUserInfo(steamId: string): Promise<{ personaName: string; avatar: string } | undefined> {
  try {
    const rows = await getDb()
      .select({ personaName: users.personaName, avatar: users.avatar })
      .from(users)
      .where(eq(users.steamId, steamId))
      .limit(1);
    if (rows.length > 0 && rows[0].personaName && rows[0].avatar) {
      return { personaName: rows[0].personaName, avatar: rows[0].avatar };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// --- Snapshots for delta computation ---

interface SnapshotData {
  achievementsEarned: number;
  avgCompletion: number;
  gamesOwned: number;
}

async function getLatestSnapshot(
  steamId: string,
  beforeDate: string,
): Promise<SnapshotData | null> {
  try {
    const rows = await getDb()
      .select()
      .from(snapshots)
      .where(
        and(eq(snapshots.steamId, steamId), lt(snapshots.date, beforeDate)),
      )
      .orderBy(desc(snapshots.date))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      achievementsEarned: row.achievementsEarned,
      avgCompletion: row.avgCompletion / 10,
      gamesOwned: row.gamesOwned,
    };
  } catch {
    return null;
  }
}

async function writeSnapshot(steamId: string, stats: Stats): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await getDb().insert(snapshots).values({
      steamId,
      date: today,
      achievementsEarned: stats.achievementsEarned,
      avgCompletion: Math.round(stats.avgCompletion * 10),
      gamesOwned: stats.gamesOwned,
    });
  } catch {
    // ignore duplicate key / write errors
  }
}

export async function snapshotUser(steamId: string): Promise<void> {
  const snapshot = await getLibrarySnapshot(steamId);
  if (snapshot.error !== null) return;
  await writeSnapshot(steamId, computeStats(snapshot.games));
}

// --- Recent achievements ---

const ACHIEVEMENTS_LIMIT = 5;

async function enrichWithSchemas(entries: EarnedEntry[]): Promise<RecentAchievement[]> {
  const uniqueAppIds = [...new Set(entries.map((e) => e.appId))];
  const schemaMaps = await Promise.all(
    uniqueAppIds.map((appId) => getSchemaForGame(appId)),
  );
  const schemaByAppId = new Map<number, Map<string, { displayName: string; description: string; icon: string; icongray: string }>>();
  uniqueAppIds.forEach((appId, i) => {
    schemaByAppId.set(appId, schemaMaps[i]);
  });

  return entries.map((entry) => {
    const schema = schemaByAppId.get(entry.appId)?.get(entry.apiname);
    return {
      appId: entry.appId,
      gameName: entry.gameName,
      gameImage: getGameHeaderImage(entry.appId),
      name: schema?.displayName ?? entry.apiname,
      description: schema?.description,
      icon: schema?.icon,
      unlocktime: entry.unlocktime,
      globalPercent: entry.globalPercent,
    };
  });
}

async function computeRecentAchievements(
  entries: EarnedEntry[],
  limit: number = ACHIEVEMENTS_LIMIT,
): Promise<RecentAchievement[]> {
  const top = [...entries]
    .sort((a, b) => b.unlocktime - a.unlocktime)
    .slice(0, limit);
  return enrichWithSchemas(top);
}

async function computeRarestAchievements(
  entries: EarnedEntry[],
  limit: number = ACHIEVEMENTS_LIMIT,
): Promise<RecentAchievement[]> {
  const top = [...entries]
    .filter((e) => e.globalPercent != null && e.globalPercent > 0)
    .sort((a, b) => (a.globalPercent ?? 100) - (b.globalPercent ?? 100))
    .slice(0, limit);
  return enrichWithSchemas(top);
}

// --- Rarity distribution ---

const RARITY_TIERS = [
  { tier: "Common", min: 50, max: 100.1, color: "var(--muted-foreground)" },
  { tier: "Uncommon", min: 25, max: 50, color: "#4ade80" },
  { tier: "Rare", min: 10, max: 25, color: "#60a5fa" },
  { tier: "Very Rare", min: 5, max: 10, color: "#c084fc" },
  { tier: "Ultra Rare", min: 0, max: 5, color: "#fbbf24" },
] as const;

function computeRarityDistribution(entries: EarnedEntry[]): RarityTier[] {
  const tiers = RARITY_TIERS.map((t) => ({ ...t, count: 0, color: t.color }));
  for (const e of entries) {
    const pct = e.globalPercent;
    for (const tier of tiers) {
      if (pct >= tier.min && pct < tier.max) {
        tier.count++;
        break;
      }
    }
  }
  return tiers.map(({ tier, count, color }) => ({ tier, count, color }));
}

// --- Main entry point ---

export interface EarnedEntry {
  appId: number;
  gameName: string;
  apiname: string;
  unlocktime: number;
  globalPercent: number;
}

export interface LibrarySnapshot {
  games: Game[];
  earnedEntries: EarnedEntry[];
  user?: { personaName: string; avatar: string };
  error: DashboardError;
}

// --- Persisted snapshot cache ---

export const SNAPSHOT_VERSION = 1;
export const SNAPSHOT_TTL_MS = 15 * 60 * 1000;

export interface PersistedSnapshot {
  version: number;
  fetchedAtMs: number;
  games: Game[];
  earnedEntries: EarnedEntry[];
  user?: { personaName: string; avatar: string };
}

export function serializeSnapshot(snapshot: PersistedSnapshot): string {
  return JSON.stringify(snapshot);
}

interface SnapshotWire {
  version?: unknown;
  fetchedAtMs?: unknown;
  games?: unknown;
  earnedEntries?: unknown;
  user?: unknown;
}

function isSnapshotWire<T>(value: T): value is T & SnapshotWire {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function deserializeSnapshot(raw: string): PersistedSnapshot | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isSnapshotWire(parsed)) return null;
  if (parsed.version !== SNAPSHOT_VERSION) return null;
  if (!isNumber(parsed.fetchedAtMs)) return null;
  if (!Array.isArray(parsed.games) || !Array.isArray(parsed.earnedEntries)) {
    return null;
  }
  // SAFETY: the version gate above only admits payloads written by
  // serializeSnapshot, so games/earnedEntries/user match PersistedSnapshot.
  return {
    version: parsed.version,
    fetchedAtMs: parsed.fetchedAtMs,
    games: parsed.games as Game[],
    earnedEntries: parsed.earnedEntries as EarnedEntry[],
    user: parsed.user as PersistedSnapshot["user"],
  };
}

export function isSnapshotFresh(
  fetchedAtMs: number,
  nowMs: number,
  ttlMs: number = SNAPSHOT_TTL_MS,
): boolean {
  return nowMs - fetchedAtMs < ttlMs;
}

async function readCachedSnapshot(
  steamId: string,
): Promise<PersistedSnapshot | null> {
  try {
    const rows = await getDb()
      .select({ payload: librarySnapshots.payload })
      .from(librarySnapshots)
      .where(eq(librarySnapshots.steamId, steamId))
      .limit(1);
    if (rows.length === 0) return null;
    return deserializeSnapshot(rows[0].payload);
  } catch {
    return null;
  }
}

async function writeCachedSnapshot(
  steamId: string,
  snapshot: Omit<PersistedSnapshot, "version" | "fetchedAtMs">,
): Promise<void> {
  const persisted: PersistedSnapshot = {
    ...snapshot,
    version: SNAPSHOT_VERSION,
    fetchedAtMs: Date.now(),
  };
  try {
    await getDb()
      .insert(librarySnapshots)
      .values({
        steamId,
        version: persisted.version,
        payload: serializeSnapshot(persisted),
        fetchedAt: new Date(persisted.fetchedAtMs),
      })
      .onConflictDoUpdate({
        target: librarySnapshots.steamId,
        set: {
          version: persisted.version,
          payload: serializeSnapshot(persisted),
          fetchedAt: new Date(persisted.fetchedAtMs),
        },
      });
  } catch {
    // ignore write errors — cache is best-effort
  }
}

async function applyTrackedState(
  steamId: string,
  persisted: Omit<PersistedSnapshot, "version" | "fetchedAtMs">,
): Promise<LibrarySnapshot> {
  const trackedSet = await getTrackedAppIds(steamId);
  return {
    games: persisted.games.map((g) => ({
      ...g,
      tracked: trackedSet.has(g.appId),
    })),
    earnedEntries: persisted.earnedEntries,
    user: persisted.user,
    error: null,
  };
}

function emptyStats(): Stats {
  return {
    achievementsEarned: 0,
    achievementsEarnedDelta: 0,
    avgCompletion: 0,
    avgCompletionDelta: null,
    gamesOwned: 0,
    gamesOwnedDelta: null,
    gamesTracked: 0,
    perfectGames: 0,
  };
}

async function fetchLibraryFromSteam(
  steamId: string,
): Promise<{
  persisted: Omit<PersistedSnapshot, "version" | "fetchedAtMs"> | null;
  error: DashboardError;
}> {
  const result = await getOwnedGames(steamId);

  if (!result.ok) {
    return {
      persisted: null,
      error: {
        type: result.reason,
        status: result.status ?? undefined,
      },
    };
  }

  if (result.games.length === 0) {
    return { persisted: { games: [], earnedEntries: [] }, error: null };
  }

  const sorted = [...result.games].sort(
    (a, b) => b.playtime_forever - a.playtime_forever,
  );
  const detailedSlice = sorted.filter(
    (g) => g.playtime_forever > 0 && g.has_community_visible_stats,
  );
  const detailedIds = new Set(detailedSlice.map((g) => g.appid));
  const basicSlice = sorted.filter((g) => !detailedIds.has(g.appid));

  const [detailedResults, user] = await Promise.all([
    mapWithConcurrency(
      detailedSlice,
      CONCURRENCY,
      async (owned) => {
        const data = await fetchGameData(steamId, owned.appid);
        const game = buildGame(
          owned.appid,
          owned.name,
          owned.playtime_forever,
          data,
        );
        return { game, earnedEntries: data.earnedEntries };
      },
    ),
    getUserInfo(steamId),
  ]);

  const detailedGames = detailedResults.map((r) => r.game);

  const basicGames: Game[] = basicSlice.map((owned) => ({
    appId: owned.appid,
    name: owned.name,
    hours: Math.round(owned.playtime_forever / 60),
    completion: 0,
    achievements: { earned: 0, total: 0 },
    comparison: { text: "No data", percent: 0, isPositive: false },
    image: getGameHeaderImage(owned.appid),
    owned: true,
    tracked: false,
    unlocktimes: [],
  }));

  const games = [...detailedGames, ...basicGames].sort(
    (a, b) => b.hours - a.hours,
  );

  const earnedEntries: EarnedEntry[] = detailedResults.flatMap((r) =>
    r.earnedEntries.map((e) => ({
      appId: r.game.appId,
      gameName: r.game.name,
      apiname: e.apiname,
      unlocktime: e.unlocktime,
      globalPercent: e.globalPercent,
    })),
  );

  return {
    persisted: { games, earnedEntries, user },
    error: null,
  };
}

export const getLibrarySnapshot = cache(
  async (steamId: string): Promise<LibrarySnapshot> => {
    const cached = await readCachedSnapshot(steamId);
    if (cached && isSnapshotFresh(cached.fetchedAtMs, Date.now())) {
      return applyTrackedState(steamId, cached);
    }

    const outcome = await fetchLibraryFromSteam(steamId);

    if (outcome.error !== null) {
      // Serve the stale cache rather than failing when we have one.
      if (cached) return applyTrackedState(steamId, cached);
      return { games: [], earnedEntries: [], error: outcome.error };
    }

    await writeCachedSnapshot(steamId, outcome.persisted!);
    return applyTrackedState(steamId, outcome.persisted!);
  },
);

export async function getDashboardData({
  steamId,
  filter = "all",
  today = new Date(),
}: {
  steamId: string;
  filter?: GameFilter;
  today?: Date;
}): Promise<DashboardData> {
  const snapshot = await getLibrarySnapshot(steamId);

  if (snapshot.error) {
    return {
      stats: emptyStats(),
      games: [],
      recentAchievements: [],
      rarestAchievements: [],
      rarityDistribution: [],
      error: snapshot.error,
    };
  }

  const games = filterGames(snapshot.games, filter);
  const stats = computeStats(games);

  const [recentAchievements, rarestAchievements, previousSnapshot] =
    await Promise.all([
      computeRecentAchievements(snapshot.earnedEntries),
      computeRarestAchievements(snapshot.earnedEntries),
      getLatestSnapshot(steamId, today.toISOString().slice(0, 10)),
    ]);

  const rarityDistribution = computeRarityDistribution(snapshot.earnedEntries);

  if (previousSnapshot) {
    stats.avgCompletionDelta =
      Math.round(
        (stats.avgCompletion - previousSnapshot.avgCompletion) * 10,
      ) / 10;
    stats.gamesOwnedDelta = stats.gamesOwned - previousSnapshot.gamesOwned;
  }

  return {
    stats,
    games,
    recentAchievements,
    rarestAchievements,
    rarityDistribution,
    error: null,
    user: snapshot.user,
  };
}

// --- Friends list ---

export interface FriendSummary {
  steamId: string;
  name: string;
  avatar: string;
  avatarFull: string;
  profileUrl: string;
}

export async function getFriendsData(
  steamId: string,
): Promise<{ friends: FriendSummary[]; error: DashboardError; hiddenCount: number }> {
  const friendIds = await getFriendList(steamId);
  if (friendIds.length === 0) {
    return { friends: [], error: null, hiddenCount: 0 };
  }

  const summaries = await getPlayerSummaries(friendIds);

  // Check each friend's profile accessibility via getOwnedGames
  const results = await mapWithConcurrency(friendIds, CONCURRENCY, async (friendId) => {
    const result = await getOwnedGames(friendId);
    return { friendId, accessible: result.ok };
  });

  const accessibleSet = new Set(
    results.filter((r) => r.accessible).map((r) => r.friendId),
  );

  const friends: FriendSummary[] = summaries
    .filter((s) => accessibleSet.has(s.steamid))
    .map((s) => ({
      steamId: s.steamid,
      name: s.personaname,
      avatar: s.avatar,
      avatarFull: s.avatarfull,
      profileUrl: s.profileurl,
    }));

  return {
    friends,
    error: null,
    hiddenCount: summaries.length - friends.length,
  };
}

// --- Achievements overview ---

export interface AchievementsOverviewData {
  stats: Stats;
  games: Game[];
  recentAchievements: RecentAchievement[];
  rarestAchievements: RecentAchievement[];
  rarestPerGame: { appId: number; gameName: string; achievement: RecentAchievement }[];
  error: DashboardError;
  user?: { personaName: string; avatar: string };
}

export async function getAchievementsData(
  steamId: string,
): Promise<AchievementsOverviewData> {
  const snapshot = await getLibrarySnapshot(steamId);

  if (snapshot.error) {
    return {
      stats: emptyStats(),
      games: [],
      recentAchievements: [],
      rarestAchievements: [],
      rarestPerGame: [],
      error: snapshot.error,
      user: snapshot.user,
    };
  }

  const games = snapshot.games;
  const stats = computeStats(games);

  const [recentAchievements, rarestAchievements] = await Promise.all([
    computeRecentAchievements(snapshot.earnedEntries, 20),
    computeRarestAchievements(snapshot.earnedEntries, 10),
  ]);

  const rarestPerGame: AchievementsOverviewData["rarestPerGame"] = (
    await Promise.all(
      games
        .filter((g) => g.achievements.total > 0)
        .map(async (game) => {
          const gameEntries = snapshot.earnedEntries.filter(
            (e) => e.appId === game.appId,
          );
          const rarest = [...gameEntries]
            .filter((e) => e.globalPercent > 0)
            .sort((a, b) => a.globalPercent - b.globalPercent)[0];
          if (!rarest) return null;
          const enriched = await enrichWithSchemas([rarest]);
          return {
            appId: game.appId,
            gameName: game.name,
            achievement: enriched[0],
          };
        }),
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null);

  return {
    stats,
    games,
    recentAchievements,
    rarestAchievements,
    rarestPerGame,
    error: null,
    user: snapshot.user,
  };
}

// --- Per-game achievement list ---

export interface GameAchievementsData {
  gameName: string;
  gameImage: string;
  appId: number;
  hours: number;
  totalAchievements: number;
  earnedAchievements: number;
  completion: number;
  achievements: GameAchievement[];
  error: DashboardError;
}

export async function getGameAchievements(
  steamId: string,
  appId: number,
): Promise<GameAchievementsData> {
  const [playerAchievements, globalPercentages, ownedResult] = await Promise.all([
    getPlayerAchievements(steamId, appId),
    getGlobalAchievementPercentages(appId),
    getOwnedGames(steamId),
  ]);

  if (playerAchievements.length === 0) {
    return {
      gameName: "",
      gameImage: getGameHeaderImage(appId),
      appId,
      hours: 0,
      totalAchievements: 0,
      earnedAchievements: 0,
      completion: 0,
      achievements: [],
      error: null,
    };
  }

  const globalPctMap = new Map<string, number>();
  for (const g of globalPercentages) {
    globalPctMap.set(g.name, Number(g.percent));
  }

  const owned = ownedResult.ok
    ? ownedResult.games.find((g) => g.appid === appId)
    : undefined;

  const schemaMap = await getSchemaForGame(appId);

  const earnedCount = playerAchievements.filter((a) => a.achieved === 1).length;
  const totalCount = playerAchievements.length;
  const completion = totalCount === 0
    ? 0
    : Math.round((earnedCount / totalCount) * 100);

  const achievements: GameAchievement[] = playerAchievements.map((a) => {
    const schema = schemaMap.get(a.apiname);
    return {
      apiname: a.apiname,
      name: schema?.displayName ?? a.apiname,
      description: schema?.description ?? "",
      icon: schema?.icon ?? "",
      icongray: schema?.icongray ?? "",
      achieved: a.achieved === 1,
      unlocktime: a.unlocktime,
      globalPercent: globalPctMap.get(a.apiname) ?? 0,
    };
  });

  return {
    gameName: owned?.name ?? "",
    gameImage: getGameHeaderImage(appId),
    appId,
    hours: owned ? Math.round(owned.playtime_forever / 60) : 0,
    totalAchievements: totalCount,
    earnedAchievements: earnedCount,
    completion: Number.isNaN(completion) ? 0 : completion,
    achievements,
    error: null,
  };
}
