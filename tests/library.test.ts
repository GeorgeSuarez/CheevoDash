import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SteamGlobalAchievement,
  SteamOwnedGame,
  SteamPlayerAchievement,
} from "@/lib/types";

const { mockWhere, mockLimit, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  return { mockWhere, mockLimit, mockFrom, mockSelect };
});

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ select: mockSelect }),
}));

vi.mock("@/lib/steam", () => ({
  getOwnedGames: vi.fn(),
  getPlayerAchievements: vi.fn(),
  getGlobalAchievementPercentages: vi.fn(),
  getSchemaForGame: vi.fn(),
  getGameHeaderImage: vi.fn(
    (appId: number) => `https://cdn.example/${appId}/header.jpg`,
  ),
  getFriendList: vi.fn(),
  getPlayerSummaries: vi.fn(),
}));

import { getAchievementsData, getLibrarySnapshot } from "@/lib/dashboard";
import {
  getGlobalAchievementPercentages,
  getOwnedGames,
  getPlayerAchievements,
  getSchemaForGame,
} from "@/lib/steam";

const NOW = Math.floor(Date.now() / 1000);
const ONE_DAY = 86400;

const achievementsByApp: Record<number, SteamPlayerAchievement[]> = {
  1245620: [
    { apiname: "ELD_1", achieved: 1, unlocktime: NOW - 3 * ONE_DAY },
    { apiname: "ELD_2", achieved: 1, unlocktime: NOW - 10 * ONE_DAY },
    { apiname: "ELD_3", achieved: 0, unlocktime: 0 },
  ],
  292030: [
    { apiname: "W3_1", achieved: 1, unlocktime: NOW - 2 * ONE_DAY },
    { apiname: "W3_2", achieved: 1, unlocktime: NOW - 5 * ONE_DAY },
    { apiname: "W3_3", achieved: 1, unlocktime: NOW - 8 * ONE_DAY },
    { apiname: "W3_4", achieved: 0, unlocktime: 0 },
  ],
  367520: [
    { apiname: "HK_1", achieved: 1, unlocktime: NOW - 12 * ONE_DAY },
    { apiname: "HK_2", achieved: 0, unlocktime: 0 },
  ],
};

const globalPctByApp: Record<number, SteamGlobalAchievement[]> = {
  1245620: [
    { name: "ELD_1", percent: 78.5 },
    { name: "ELD_2", percent: 30.7 },
    { name: "ELD_3", percent: 5.4 },
  ],
  292030: [
    { name: "W3_1", percent: 90.1 },
    { name: "W3_2", percent: 60.2 },
    { name: "W3_3", percent: 20.3 },
    { name: "W3_4", percent: 10.4 },
  ],
  367520: [
    { name: "HK_1", percent: 50 },
    { name: "HK_2", percent: 5 },
  ],
};

function ownedGames(...games: SteamOwnedGame[]): { ok: true; games: SteamOwnedGame[] } {
  return { ok: true, games };
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
    name: "The Witcher 3",
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

function queryResult(rows: unknown) {
  return {
    then: (resolve: (v: unknown) => void) => resolve(rows),
    limit: mockLimit,
  };
}

beforeEach(() => {
  mockWhere.mockReset().mockImplementation(() => queryResult([]));
  mockLimit.mockReset().mockResolvedValue([]);
  mockFrom.mockReset().mockImplementation(() => ({
    where: mockWhere,
    limit: mockLimit,
  }));
  mockSelect.mockReset().mockImplementation(() => ({ from: mockFrom }));

  vi.mocked(getOwnedGames).mockReset();
  vi.mocked(getPlayerAchievements)
    .mockReset()
    .mockImplementation((_steamId, appId) =>
      Promise.resolve(achievementsByApp[appId] ?? []),
    );
  vi.mocked(getGlobalAchievementPercentages)
    .mockReset()
    .mockImplementation((appId) =>
      Promise.resolve(globalPctByApp[appId] ?? []),
    );
  vi.mocked(getSchemaForGame).mockReset().mockResolvedValue(new Map());
});

describe("getLibrarySnapshot", () => {
  it("builds the enriched library with earned entries, tracked flags, and user", async () => {
    mockWhere.mockImplementationOnce(() => queryResult([{ appId: 1245620 }]));
    mockLimit.mockResolvedValueOnce([
      {
        personaName: "Dreadnought",
        avatar: "https://avatars.steamstatic.com/a1.jpg",
      },
    ]);
    vi.mocked(getOwnedGames).mockResolvedValue(ownedGames(...detailedLibrary));

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
      gameName: "The Witcher 3",
      globalPercent: 90.1,
    });

    expect(snapshot.user).toEqual({
      personaName: "Dreadnought",
      avatar: "https://avatars.steamstatic.com/a1.jpg",
    });
  });

  it("returns a private_profile error with no enrichment", async () => {
    vi.mocked(getOwnedGames).mockResolvedValue({
      ok: false,
      reason: "private_profile",
      status: 403,
    });

    const snapshot = await getLibrarySnapshot("76561198000000002");

    expect(snapshot.error).toEqual({ type: "private_profile", status: 403 });
    expect(snapshot.games).toEqual([]);
    expect(snapshot.earnedEntries).toEqual([]);
    expect(vi.mocked(getPlayerAchievements)).not.toHaveBeenCalled();
  });

  it("returns an empty library without error when the account owns no games", async () => {
    vi.mocked(getOwnedGames).mockResolvedValue(ownedGames());

    const snapshot = await getLibrarySnapshot("76561198000000003");

    expect(snapshot.error).toBeNull();
    expect(snapshot.games).toEqual([]);
    expect(snapshot.earnedEntries).toEqual([]);
  });

  it("skips enrichment for basic games but still includes them with zeroed data", async () => {
    mockWhere.mockImplementationOnce(() => queryResult([{ appId: 1245620 }]));
    vi.mocked(getOwnedGames).mockResolvedValue(
      ownedGames(detailedLibrary[0], {
        appid: 1234,
        name: "Idle Clicker",
        playtime_forever: 0,
        img_icon_url: "abc",
        img_logo_url: "def",
        has_community_visible_stats: false,
      }),
    );

    const snapshot = await getLibrarySnapshot("76561198000000004");

    expect(vi.mocked(getPlayerAchievements)).toHaveBeenCalledTimes(1);
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
    mockWhere.mockImplementationOnce(() => queryResult([{ appId: 1245620 }]));
    vi.mocked(getOwnedGames).mockResolvedValue(ownedGames(...detailedLibrary));

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

    expect(vi.mocked(getPlayerAchievements)).toHaveBeenCalledTimes(3);
  });
});
