import { cache } from "react";
import { env } from "./env";
import type {
  SteamFriendListResponse,
  SteamGlobalAchievement,
  SteamGlobalAchievementsResponse,
  SteamOwnedGame,
  SteamOwnedGamesResponse,
  SteamPlayerAchievement,
  SteamPlayerAchievementsResponse,
  SteamPlayerSummary,
  SteamPlayerSummariesResponse,
} from "./types";

const STEAM_API_BASE = "https://api.steampowered.com";

async function steamFetch<T>(
  url: string,
): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    return data;
  } catch {
    return null;
  }
}

export type OwnedGamesResult =
  | { ok: true; games: SteamOwnedGame[] }
  | { ok: false; reason: "private_profile" | "api_error" };

export const getOwnedGames = cache(
  async (steamId: string): Promise<OwnedGamesResult> => {
    const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`);
    url.searchParams.set("key", env.steamApiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("include_appinfo", "true");
    url.searchParams.set("include_played_free_games", "true");

    const data = await steamFetch<SteamOwnedGamesResponse>(url.toString());
    if (!data) return { ok: false, reason: "api_error" };
    if (!data.response) return { ok: false, reason: "api_error" };
    if (Array.isArray(data.response)) return { ok: false, reason: "api_error" };
    if (!("games" in data.response)) return { ok: false, reason: "private_profile" };
    return { ok: true, games: data.response.games ?? [] };
  },
);

export const getPlayerAchievements = cache(
  async (
    steamId: string,
    appId: number,
  ): Promise<SteamPlayerAchievement[]> => {
    const url = new URL(
      `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/`,
    );
    url.searchParams.set("key", env.steamApiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("appid", String(appId));

    const data = await steamFetch<SteamPlayerAchievementsResponse>(url.toString());
    return data?.playerstats?.achievements ?? [];
  },
);

export const getGlobalAchievementPercentages = cache(
  async (appId: number): Promise<SteamGlobalAchievement[]> => {
    const url = new URL(
      `${STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/`,
    );
    url.searchParams.set("key", env.steamApiKey);
    url.searchParams.set("gameid", String(appId));

    const data = await steamFetch<SteamGlobalAchievementsResponse>(url.toString());
    return data?.achievementpercentages?.achievements ?? [];
  },
);

export const getPlayerSummaries = cache(
  async (steamIds: string[]): Promise<SteamPlayerSummary[]> => {
    const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`);
    url.searchParams.set("key", env.steamApiKey);
    url.searchParams.set("steamids", steamIds.join(","));

    const data = await steamFetch<SteamPlayerSummariesResponse>(url.toString());
    return data?.response?.players ?? [];
  },
);

export const getFriendList = cache(
  async (steamId: string): Promise<string[]> => {
    const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetFriendList/v1/`);
    url.searchParams.set("key", env.steamApiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("relationship", "friend");

    const data = await steamFetch<SteamFriendListResponse>(url.toString());
    return (data?.friendslist?.friends ?? []).map((f) => f.steamid);
  },
);

export function getGameHeaderImage(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}
