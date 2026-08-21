import type { Game, GameFilter } from "./types";

export type GameSortKey = "playtime" | "completion" | "achievements" | "name";

export const GAME_SORT_KEYS: GameSortKey[] = [
  "playtime",
  "completion",
  "achievements",
  "name",
];

export interface GameViewOptions {
  search: string;
  filter: GameFilter;
  sort: GameSortKey;
}

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

export function searchSortGames(
  games: Game[],
  { search, filter, sort }: GameViewOptions,
): Game[] {
  const result = filterGames(games, filter);

  const query = search.trim().toLowerCase();
  const matched = query
    ? result.filter((g) => g.name.toLowerCase().includes(query))
    : result;

  const sorted = [...matched];
  switch (sort) {
    case "completion":
      sorted.sort((a, b) => b.completion - a.completion);
      break;
    case "achievements":
      sorted.sort((a, b) => b.achievements.earned - a.achievements.earned);
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      sorted.sort((a, b) => b.hours - a.hours);
  }
  return sorted;
}

export function hideGames(games: Game[], hiddenAppIds: number[]): Game[] {
  if (hiddenAppIds.length === 0) return games;
  const hidden = new Set(hiddenAppIds);
  return games.filter((g) => !hidden.has(g.appId));
}
