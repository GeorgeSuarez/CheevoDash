import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "@/lib/db/client";
import { librarySnapshots, trackedGames, users } from "@/lib/db/schema";
import {
  getAchievementsData,
  getLibrarySnapshot,
  serializeSnapshot,
  SNAPSHOT_VERSION,
} from "@/lib/dashboard";
import type { PersistedSnapshot } from "@/lib/dashboard";
import type {
  SteamGlobalAchievementsResponse,
  SteamOwnedGame,
  SteamOwnedGamesResponse,
  SteamPlayerAchievement,
  SteamPlayerAchievementsResponse,
} from "@/lib/types";

process.env.TURSO_DATABASE_URL = "file::memory:";
process.env.STEAM_API_KEY = "test-key";

const NOW = Math.floor(Date.now() / 1000);
const ONE_DAY = 86400;

const playerAchByApp = new Map<number, SteamPlayerAchievement[]>([
  [
    1245620,
    [
      { apiname: "ELD_1", achieved: 1, unlocktime: NOW - 3 * ONE_DAY },
      { apiname: "ELD_2", achieved: 1, unlocktime: NOW - 10 * ONE_DAY },
      { apiname: "ELD_3", achieved: 0, unlocktime: 0 },
    ],
  ],
  [
    292030,
    [
      { apiname: "W3_1", achieved: 1, unlocktime: NOW - 2 * ONE_DAY },
      { apiname: "W3_2", achieved: 1, unlocktime: NOW - 5 * ONE_DAY },
      { apiname: "W3_3", achieved: 1, unlocktime: NOW - 8 * ONE_DAY },
      { apiname: "W3_4", achieved: 0, unlocktime: 0 },
    ],
  ],
  [
    367520,
    [
      { apiname: "HK_1", achieved: 1, unlocktime: NOW - 12 * ONE_DAY },
      { apiname: "HK_2", achieved: 0, unlocktime: 0 },
    ],
  ],
]);

const globalPctByApp = new Map<number, { name: string; percent: number }[]>([
  [
    1245620,
    [
      { name: "ELD_1", percent: 78.5 },
      { name: "ELD_2", percent: 30.7 },
      { name: "ELD_3", percent: 5.4 },
    ],
  ],
  [
    292030,
    [
      { name: "W3_1", percent: 90.1 },
      { name: "W3_2", percent: 60.2 },
      { name: "W3_3", percent: 20.3 },
      { name: "W3_4", percent: 10.4 },
    ],
  ],
  [
    367520,
    [
      { name: "HK_1", percent: 50 },
      { name: "HK_2", percent: 5 },
    ],
  ],
]);

function ownedGamesResponse(games: SteamOwnedGame[]): SteamOwnedGamesResponse {
  return { response: { game_count: games.length, games } };
}

const detailedLibrary: SteamOwnedGame[] = [
  {
    appid: 1245620,
    name: "Elden Ring",
    playtime_forever: 7200,
    img_icon_url: "abc",
    img_logo_url: "def",
    has_community_visible_stats: true,
  },
  {
    appid: 292030,
    name: "The Witcher 3: Wild Hunt",
    playtime_forever: 5880,
    img_icon_url: "ghi",
    img_logo_url: "jkl",
    has_community_visible_stats: true,
  },
  {
    appid: 367520,
    name: "Hollow Knight",
    playtime_forever: 2700,
    img_icon_url: "mno",
    img_logo_url: "pqr",
    has_community_visible_stats: true,
  },
];

let ownedGamesResult: SteamOwnedGamesResponse = ownedGamesResponse([]);
const steamCalls: string[] = [];

async function fetchStub(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(String(input));
  steamCalls.push(url.pathname);

  if (url.pathname === "/IPlayerService/GetOwnedGames/v1/") {
    return Response.json(ownedGamesResult);
  }
  if (url.pathname === "/ISteamUserStats/GetPlayerAchievements/v1/") {
    const achievements =
      playerAchByApp.get(Number(url.searchParams.get("appid"))) ?? [];
    const body: SteamPlayerAchievementsResponse = {
      playerstats: {
        steamID: url.searchParams.get("steamid") ?? "",
        gameName: "",
        achievements,
      },
    };
    return Response.json(body);
  }
  if (
    url.pathname ===
    "/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/"
  ) {
    const achievements =
      globalPctByApp.get(Number(url.searchParams.get("gameid"))) ?? [];
    const body: SteamGlobalAchievementsResponse = {
      achievementpercentages: { achievements },
    };
    return Response.json(body);
  }
  return Response.json({});
}

const realFetch = globalThis.fetch;

async function seedUser(steamId: string, personaName: string, avatar: string) {
  await getDb()
    .insert(users)
    .values({ steamId, personaName, avatar })
    .onConflictDoNothing();
}

async function trackApps(steamId: string, appIds: number[]) {
  await getDb()
    .insert(trackedGames)
    .values(appIds.map((appId) => ({ steamId, appId })))
    .onConflictDoNothing();
}

async function seedLibrarySnapshot(
  steamId: string,
  snapshot: PersistedSnapshot,
) {
  const payload = serializeSnapshot(snapshot);
  await getDb()
    .insert(librarySnapshots)
    .values({
      steamId,
      version: snapshot.version,
      payload,
      fetchedAt: new Date(snapshot.fetchedAtMs),
    })
    .onConflictDoUpdate({
      target: librarySnapshots.steamId,
      set: {
        version: snapshot.version,
        payload,
        fetchedAt: new Date(snapshot.fetchedAtMs),
      },
    });
}

beforeAll(async () => {
  globalThis.fetch = fetchStub;
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

beforeEach(async () => {
  const db = getDb();
  await db.delete(trackedGames);
  await db.delete(users);
  await db.delete(librarySnapshots);
  steamCalls.length = 0;
  ownedGamesResult = ownedGamesResponse([]);
});

describe("getLibrarySnapshot", () => {
  it("builds the enriched library with earned entries, tracked flags, and user", async () => {
    ownedGamesResult = ownedGamesResponse(detailedLibrary);
    await trackApps("76561198000000001", [1245620]);
    await seedUser(
      "76561198000000001",
      "Dreadnought",
      "https://avatars.steamstatic.com/a1.jpg",
    );

    const snapshot = await getLibrarySnapshot("76561198000000001");

    expect(snapshot.error).toBeNull();
    expect(snapshot.games.map((g) => g.appId)).toEqual([
      1245620,
      292030,
      367520,
    ]);

    const elden = snapshot.games[0];
    expect(elden.hours).toBe(120);
    expect(elden.achievements).toEqual({ earned: 2, total: 3 });
    expect(elden.completion).toBe(67);
    expect(elden.tracked).toBe(true);
    expect(elden.comparison).toEqual({
      text: "You're ahead of",
      percent: 38.2,
      isPositive: true,
    });
    expect(snapshot.games[1].tracked).toBe(false);
    expect(snapshot.games[2].hours).toBe(45);

    expect(snapshot.earnedEntries).toHaveLength(6);
    expect(snapshot.earnedEntries[0]).toMatchObject({
      appId: 1245620,
      gameName: "Elden Ring",
      apiname: "ELD_1",
      globalPercent: 78.5,
    });
    expect(snapshot.earnedEntries[2]).toMatchObject({
      appId: 292030,
      gameName: "The Witcher 3: Wild Hunt",
      globalPercent: 90.1,
    });

    expect(snapshot.user).toEqual({
      personaName: "Dreadnought",
      avatar: "https://avatars.steamstatic.com/a1.jpg",
    });
  });

  it("returns a private_profile error with no enrichment", async () => {
    ownedGamesResult = { response: {} };

    const snapshot = await getLibrarySnapshot("76561198000000002");

    expect(snapshot.error).toEqual({ type: "private_profile", status: 200 });
    expect(snapshot.games).toEqual([]);
    expect(snapshot.earnedEntries).toEqual([]);
    expect(
      steamCalls.filter((p) => p.includes("GetPlayerAchievements")),
    ).toHaveLength(0);
  });

  it("returns an empty library without error when the account owns no games", async () => {
    ownedGamesResult = ownedGamesResponse([]);

    const snapshot = await getLibrarySnapshot("76561198000000003");

    expect(snapshot.error).toBeNull();
    expect(snapshot.games).toEqual([]);
    expect(snapshot.earnedEntries).toEqual([]);
  });

  it("serves a fresh cached snapshot without hitting Steam", async () => {
    await seedLibrarySnapshot("76561198000000006", {
      version: SNAPSHOT_VERSION,
      fetchedAtMs: Date.now(),
      games: [
        {
          appId: 100,
          name: "Cached Game",
          hours: 10,
          completion: 50,
          achievements: { earned: 5, total: 10 },
          comparison: {
            text: "You're ahead of",
            percent: 40,
            isPositive: true,
          },
          image: "https://cdn.example/100/header.jpg",
          owned: true,
          tracked: false,
          unlocktimes: [],
        },
      ],
      earnedEntries: [],
      user: { personaName: "Cached User", avatar: "https://cdn.example/a.jpg" },
    });
    await trackApps("76561198000000006", [100]);
    ownedGamesResult = ownedGamesResponse(detailedLibrary);

    const snapshot = await getLibrarySnapshot("76561198000000006");

    expect(snapshot.error).toBeNull();
    expect(steamCalls.filter((p) => p.includes("GetOwnedGames"))).toHaveLength(
      0,
    );
    expect(
      steamCalls.filter((p) => p.includes("GetPlayerAchievements")),
    ).toHaveLength(0);
    expect(snapshot.games).toHaveLength(1);
    expect(snapshot.games[0]).toMatchObject({ appId: 100, tracked: true });
    expect(snapshot.user).toEqual({
      personaName: "Cached User",
      avatar: "https://cdn.example/a.jpg",
    });
  });

  it("falls back to a stale cached snapshot when Steam errors", async () => {
    await seedLibrarySnapshot("76561198000000007", {
      version: SNAPSHOT_VERSION,
      fetchedAtMs: Date.now() - 24 * 60 * 60 * 1000,
      games: [
        {
          id: "200",
          appId: 200,
          name: "Stale Game",
          hours: 2,
          completion: 20,
          achievements: { earned: 2, total: 10 },
          comparison: { text: "You're behind", percent: 40, isPositive: false },
          image: "https://cdn.example/200/header.jpg",
          owned: true,
          tracked: false,
          unlocktimes: [],
        },
      ],
      earnedEntries: [],
    });
    ownedGamesResult = { response: {} };

    const snapshot = await getLibrarySnapshot("76561198000000007");

    expect(snapshot.error).toBeNull();
    expect(snapshot.games.map((g) => g.appId)).toEqual([200]);
  });

  it("refetches from Steam when the cache is stale", async () => {
    await seedLibrarySnapshot("76561198000000008", {
      version: SNAPSHOT_VERSION,
      fetchedAtMs: Date.now() - 24 * 60 * 60 * 1000,
      games: [],
      earnedEntries: [],
    });
    ownedGamesResult = ownedGamesResponse(detailedLibrary);

    const snapshot = await getLibrarySnapshot("76561198000000008");

    expect(snapshot.error).toBeNull();
    expect(snapshot.games.map((g) => g.appId)).toEqual([
      1245620,
      292030,
      367520,
    ]);
    expect(
      steamCalls.filter((p) => p.includes("GetPlayerAchievements")),
    ).toHaveLength(3);
  });

  it("skips enrichment for basic games but still includes them with zeroed data", async () => {
    ownedGamesResult = ownedGamesResponse([
      detailedLibrary[0],
      {
        appid: 1234,
        name: "Idle Clicker",
        playtime_forever: 0,
        img_icon_url: "abc",
        img_logo_url: "def",
        has_community_visible_stats: false,
      },
    ]);
    await trackApps("76561198000000004", [1245620]);

    const snapshot = await getLibrarySnapshot("76561198000000004");

    expect(
      steamCalls.filter((p) => p.includes("GetPlayerAchievements")),
    ).toHaveLength(1);
    expect(snapshot.games).toHaveLength(2);
    expect(snapshot.games[1]).toMatchObject({
      appId: 1234,
      name: "Idle Clicker",
      hours: 0,
      completion: 0,
      achievements: { earned: 0, total: 0 },
      tracked: false,
    });
  });
});

describe("getAchievementsData", () => {
  it("reuses the snapshot and does not re-fetch game data for earned entries", async () => {
    ownedGamesResult = ownedGamesResponse(detailedLibrary);
    await trackApps("76561198000000005", [1245620]);

    const data = await getAchievementsData("76561198000000005");

    expect(data.error).toBeNull();
    expect(data.games.map((g) => g.appId)).toEqual([
      1245620,
      292030,
      367520,
    ]);
    expect(data.stats.achievementsEarned).toBe(6);
    expect(data.recentAchievements).toHaveLength(6);
    expect(data.rarestPerGame).toHaveLength(3);

    expect(
      steamCalls.filter((p) => p.includes("GetPlayerAchievements")),
    ).toHaveLength(3);
  });
});
