import type {
  SteamGlobalAchievementsResponse,
  SteamOwnedGamesResponse,
  SteamPlayerAchievementsResponse,
  SteamPlayerSummariesResponse,
} from "@/lib/types";

export const ownedGamesFixture: SteamOwnedGamesResponse = {
  response: {
    game_count: 3,
    games: [
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
    ],
  },
};

export const privateProfileFixture: SteamOwnedGamesResponse = {
  response: {},
};

export const emptyGamesFixture: SteamOwnedGamesResponse = {
  response: {
    game_count: 0,
    games: [],
  },
};

const NOW = Math.floor(Date.now() / 1000);
const ONE_DAY = 86400;

export const playerAchievementsFixture: SteamPlayerAchievementsResponse = {
  playerstats: {
    steamID: "76561198000000000",
    gameName: "Elden Ring",
    achievements: [
      { apiname: "ACH_1", achieved: 1, unlocktime: NOW - 40 * ONE_DAY },
      { apiname: "ACH_2", achieved: 1, unlocktime: NOW - 20 * ONE_DAY },
      { apiname: "ACH_3", achieved: 1, unlocktime: NOW - 5 * ONE_DAY },
      { apiname: "ACH_4", achieved: 1, unlocktime: NOW - 1 * ONE_DAY },
      { apiname: "ACH_5", achieved: 0, unlocktime: 0 },
      { apiname: "ACH_6", achieved: 0, unlocktime: 0 },
    ],
  },
};

export const emptyPlayerAchievementsFixture: SteamPlayerAchievementsResponse = {
  playerstats: {
    steamID: "76561198000000000",
    gameName: "Test Game",
    achievements: [],
  },
};

export const globalAchievementsFixture: SteamGlobalAchievementsResponse = {
  achievementpercentages: {
    achievements: [
      { name: "ACH_1", percent: 78.5 },
      { name: "ACH_2", percent: 65.3 },
      { name: "ACH_3", percent: 42.1 },
      { name: "ACH_4", percent: 30.7 },
      { name: "ACH_5", percent: 15.2 },
      { name: "ACH_6", percent: 5.4 },
    ],
  },
};

export const playerSummariesFixture: SteamPlayerSummariesResponse = {
  response: {
    players: [
      {
        steamid: "76561198000000001",
        personaname: "Dreadnought",
        avatar: "https://avatars.steamstatic.com/a1.jpg",
        avatarmedium: "https://avatars.steamstatic.com/a1_med.jpg",
        avatarfull: "https://avatars.steamstatic.com/a1_full.jpg",
        profileurl: "https://steamcommunity.com/id/dreadnought",
      },
      {
        steamid: "76561198000000002",
        personaname: "PixelPirate",
        avatar: "https://avatars.steamstatic.com/a2.jpg",
        avatarmedium: "https://avatars.steamstatic.com/a2_med.jpg",
        avatarfull: "https://avatars.steamstatic.com/a2_full.jpg",
        profileurl: "https://steamcommunity.com/id/pixelpirate",
      },
    ],
  },
};
