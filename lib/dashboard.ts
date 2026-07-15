import { and, eq, lt, desc } from "drizzle-orm";
import { getDb } from "./db/client";
import { snapshots, trackedGames, users } from "./db/schema";
import {
  getFriendList,
  getGameHeaderImage,
  getGlobalAchievementPercentages,
  getOwnedGames,
  getPlayerAchievements,
  getPlayerSummaries,
} from "./steam";
import { reconstructSeries } from "./series";
import type {
  DashboardData,
  DashboardError,
  DateRange,
  Friend,
  Game,
  GameFilter,
  Stats,
  SteamGlobalAchievement,
} from "./types";

export { reconstructSeries } from "./series";

const CONCURRENCY = 5;
const MAX_DETAILED_GAMES = 50;

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

  return {
    achievements: { earned, total },
    unlocktimes,
    communityAvg: meanGlobalPercent(globalPercentages),
  };
}

function buildGame(
  appId: number,
  name: string,
  playtimeMinutes: number,
  data: GameData,
  tracked: boolean,
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
    id: String(appId),
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
    tracked,
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
  const data = await getDashboardData({ steamId, filter: "all", range: "30d" });
  if (data.error !== null) return;
  await writeSnapshot(steamId, data.stats);
}

// --- Main entry point ---

export async function getDashboardData({
  steamId,
  filter = "all",
  range = "30d",
  today = new Date(),
}: {
  steamId: string;
  filter?: GameFilter;
  range?: DateRange;
  today?: Date;
}): Promise<DashboardData> {
  const result = await getOwnedGames(steamId);

  if (!result.ok) {
    return {
      stats: {
        achievementsEarned: 0,
        achievementsEarnedDelta: 0,
        avgCompletion: 0,
        avgCompletionDelta: null,
        gamesOwned: 0,
        gamesOwnedDelta: null,
        gamesTracked: 0,
        perfectGames: 0,
      },
      achievementSeries: reconstructSeries([], 0, 0, range, today),
      comparison: { you: 0, community: 0 },
      friends: [],
      games: [],
      error: { type: result.reason, status: result.status ?? undefined },
    };
  }

  const ownedGames = result.games;

  if (ownedGames.length === 0) {
    return {
      stats: {
        achievementsEarned: 0,
        achievementsEarnedDelta: 0,
        avgCompletion: 0,
        avgCompletionDelta: null,
        gamesOwned: 0,
        gamesOwnedDelta: null,
        gamesTracked: 0,
        perfectGames: 0,
      },
      achievementSeries: reconstructSeries([], 0, 0, range, today),
      comparison: { you: 0, community: 0 },
      friends: [],
      games: [],
      error: null,
    };
  }

  // Sort by playtime descending and split into detailed vs basic
  const sorted = [...ownedGames].sort(
    (a, b) => b.playtime_forever - a.playtime_forever,
  );
  const detailedCandidates = sorted.filter(
    (g) => g.playtime_forever > 0 && g.has_community_visible_stats,
  );
  const detailedSlice = detailedCandidates.slice(0, MAX_DETAILED_GAMES);
  const detailedIds = new Set(detailedSlice.map((g) => g.appid));
  const basicSlice = sorted.filter((g) => !detailedIds.has(g.appid));

  // Fetch tracked IDs in parallel with game achievement data
  const [trackedSet, detailedGames] = await Promise.all([
    getTrackedAppIds(steamId),
    mapWithConcurrency(
      detailedSlice,
      CONCURRENCY,
      async (owned) => {
        const data = await fetchGameData(steamId, owned.appid);
        return buildGame(
          owned.appid,
          owned.name,
          owned.playtime_forever,
          data,
          false, // placeholder, replaced below
        );
      },
    ),
  ]);

  // Patch tracked flag after parallel fetch completes
  for (const game of detailedGames) {
    game.tracked = trackedSet.has(game.appId);
  }

  // Create basic game objects for the rest (no API calls)
  const basicGames: Game[] = basicSlice.map((owned) => ({
    id: String(owned.appid),
    appId: owned.appid,
    name: owned.name,
    hours: Math.round(owned.playtime_forever / 60),
    completion: 0,
    achievements: { earned: 0, total: 0 },
    comparison: { text: "No data", percent: 0, isPositive: false },
    image: getGameHeaderImage(owned.appid),
    owned: true,
    tracked: trackedSet.has(owned.appid),
    unlocktimes: [],
  }));

  const gamesWithData = [...detailedGames, ...basicGames];

  const filtered = filterGames(gamesWithData, filter);
  const stats = computeStats(filtered);

  const allUnlocktimes = filtered.flatMap((g) => g.unlocktimes);
  const totalAchievements = filtered.reduce(
    (sum, g) => sum + g.achievements.total,
    0,
  );
  const communityAvg =
    filtered.length === 0
      ? 0
      : Math.round(
          (filtered.reduce((sum, g) => sum + (g.comparison.percent || 0), 0) /
            filtered.length) *
            10,
        ) / 10;

  const safeCommunityAvg = Number.isNaN(communityAvg) ? 0 : communityAvg;

  const achievementSeries = reconstructSeries(
    allUnlocktimes,
    totalAchievements,
    safeCommunityAvg,
    range,
    today,
  );

  const comparison = { you: stats.avgCompletion, community: safeCommunityAvg };
  const games = [...filtered].sort((a, b) => b.hours - a.hours);
  const topGameWithAch = games.find((g) => g.achievements.total > 0);

  // Run friends, snapshot, and user info in parallel (all independent)
  const [friends, snapshot, user] = await Promise.all([
    topGameWithAch
      ? getFriendsComparison(steamId, topGameWithAch.appId, 5)
      : Promise.resolve([] as Friend[]),
    getLatestSnapshot(steamId, today.toISOString().slice(0, 10)),
    getUserInfo(steamId),
  ]);

  if (snapshot) {
    stats.avgCompletionDelta =
      Math.round((stats.avgCompletion - snapshot.avgCompletion) * 10) / 10;
    stats.gamesOwnedDelta = stats.gamesOwned - snapshot.gamesOwned;
  }

  return { stats, achievementSeries, comparison, friends, games, error: null, user };
}

// --- Lightweight games-only entry point ---

export interface GamesData {
  games: Game[];
  user?: { personaName: string; avatar: string };
  error: DashboardError;
}

export async function getGamesData({
  steamId,
}: {
  steamId: string;
}): Promise<GamesData> {
  const result = await getOwnedGames(steamId);

  if (!result.ok) {
    return {
      games: [],
      error: { type: result.reason, status: result.status ?? undefined },
    };
  }

  const ownedGames = result.games;
  if (ownedGames.length === 0) {
    return { games: [], error: null };
  }

  const sorted = [...ownedGames].sort(
    (a, b) => b.playtime_forever - a.playtime_forever,
  );
  const detailedCandidates = sorted.filter(
    (g) => g.playtime_forever > 0 && g.has_community_visible_stats,
  );
  const detailedSlice = detailedCandidates.slice(0, MAX_DETAILED_GAMES);
  const detailedIds = new Set(detailedSlice.map((g) => g.appid));
  const basicSlice = sorted.filter((g) => !detailedIds.has(g.appid));

  const [trackedSet, detailedGames] = await Promise.all([
    getTrackedAppIds(steamId),
    mapWithConcurrency(
      detailedSlice,
      CONCURRENCY,
      async (owned) => {
        const data = await fetchGameData(steamId, owned.appid);
        return buildGame(
          owned.appid,
          owned.name,
          owned.playtime_forever,
          data,
          false,
        );
      },
    ),
  ]);

  for (const game of detailedGames) {
    game.tracked = trackedSet.has(game.appId);
  }

  const basicGames: Game[] = basicSlice.map((owned) => ({
    id: String(owned.appid),
    appId: owned.appid,
    name: owned.name,
    hours: Math.round(owned.playtime_forever / 60),
    completion: 0,
    achievements: { earned: 0, total: 0 },
    comparison: { text: "No data", percent: 0, isPositive: false },
    image: getGameHeaderImage(owned.appid),
    owned: true,
    tracked: trackedSet.has(owned.appid),
    unlocktimes: [],
  }));

  const games = [...detailedGames, ...basicGames].sort(
    (a, b) => b.hours - a.hours,
  );

  const user = await getUserInfo(steamId);

  return { games, user, error: null };
}

// --- Per-game friends comparison ---

export async function getFriendsComparison(
  steamId: string,
  appId: number,
  limit = 50,
): Promise<Friend[]> {
  const [friendIds, yourAchievements] = await Promise.all([
    getFriendList(steamId),
    getPlayerAchievements(steamId, appId),
  ]);

  const yourEarned = yourAchievements.filter((a) => a.achieved === 1).length;
  const yourTotal = yourAchievements.length;
  const yourPercent =
    yourTotal === 0 ? 0 : Math.round((yourEarned / yourTotal) * 1000) / 10;

  const you: Friend = {
    id: "f-you",
    name: "You",
    percent: Number.isNaN(yourPercent) ? 0 : yourPercent,
    avatar: "",
    isYou: true,
  };

  if (friendIds.length === 0) {
    return [you];
  }

  const topFriendIds = friendIds.slice(0, limit + 2);
  const summaries = await getPlayerSummaries(topFriendIds);

  const friendsWithData = await mapWithConcurrency(
    summaries,
    CONCURRENCY,
    async (summary) => {
      const achievements = await getPlayerAchievements(summary.steamid, appId);
      const earned = achievements.filter((a) => a.achieved === 1).length;
      const total = achievements.length;
      const percent =
        total === 0 ? 0 : Math.round((earned / total) * 1000) / 10;
      return {
        id: summary.steamid,
        name: summary.personaname,
        percent: Number.isNaN(percent) ? 0 : percent,
        avatar: summary.avatarmedium,
        isYou: false,
        total,
      };
    },
  );

  const sorted = friendsWithData
    .filter((f): f is Friend & { total: number } => f !== null && f.total > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit)
    .map(({ total, ...friend }) => {
      void total;
      return friend;
    });

  return [you, ...sorted];
}

export const DASHBOARD_FILTERS: GameFilter[] = ["all", "owned", "tracked"];
export const DASHBOARD_RANGES: DateRange[] = ["7d", "30d", "90d", "1y"];
