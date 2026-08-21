import { describe, it, expect } from "vitest";
import { searchSortGames } from "@/lib/game-filtering";
import type { Game } from "@/lib/types";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "g-1",
    appId: 100,
    name: "Test Game",
    hours: 50,
    completion: 75,
    achievements: { earned: 30, total: 40 },
    comparison: { text: "You're ahead of", percent: 45, isPositive: true },
    image: "https://example.com/img.jpg",
    owned: true,
    tracked: false,
    unlocktimes: [],
    ...overrides,
  };
}

const library = [
  makeGame({ id: "1", appId: 1, name: "Elden Ring", hours: 120, completion: 67, achievements: { earned: 2, total: 3 }, tracked: true }),
  makeGame({ id: "2", appId: 2, name: "Witcher 3", hours: 98, completion: 90, achievements: { earned: 9, total: 10 } }),
  makeGame({ id: "3", appId: 3, name: "Hollow Knight", hours: 45, completion: 50, achievements: { earned: 5, total: 10 } }),
  makeGame({ id: "4", appId: 4, name: "elden ring survival", hours: 10, completion: 10, achievements: { earned: 1, total: 10 } }),
];

describe("searchSortGames", () => {
  it("returns all games sorted by playtime by default", () => {
    const result = searchSortGames(library, {
      search: "",
      filter: "all",
      sort: "playtime",
    });
    expect(result.map((g) => g.appId)).toEqual([1, 2, 3, 4]);
  });

  it("does not mutate the input array", () => {
    const before = [...library];
    searchSortGames(library, { search: "", filter: "all", sort: "name" });
    expect(library).toEqual(before);
  });

  // --- search ---

  describe("search", () => {
    it("matches case-insensitive substrings", () => {
      const result = searchSortGames(library, {
        search: "ELDEN",
        filter: "all",
        sort: "playtime",
      });
      expect(result.map((g) => g.appId)).toEqual([1, 4]);
    });

    it("ignores whitespace-only searches", () => {
      const result = searchSortGames(library, {
        search: "   ",
        filter: "all",
        sort: "playtime",
      });
      expect(result).toHaveLength(4);
    });

    it("returns empty for no matches", () => {
      const result = searchSortGames(library, {
        search: "zzz",
        filter: "all",
        sort: "playtime",
      });
      expect(result).toEqual([]);
    });
  });

  // --- filter ---

  describe("filter", () => {
    it("keeps only tracked games", () => {
      const result = searchSortGames(library, {
        search: "",
        filter: "tracked",
        sort: "playtime",
      });
      expect(result.map((g) => g.appId)).toEqual([1]);
    });

    it("keeps only owned games", () => {
      const result = searchSortGames(
        [
          ...library,
          makeGame({ id: "5", appId: 5, name: "Free Game", owned: false }),
        ],
        { search: "", filter: "owned", sort: "playtime" },
      );
      expect(result.map((g) => g.appId)).toEqual([1, 2, 3, 4]);
    });

    it("combines filter and search", () => {
      const result = searchSortGames(library, {
        search: "elden",
        filter: "tracked",
        sort: "playtime",
      });
      expect(result.map((g) => g.appId)).toEqual([1]);
    });
  });

  // --- sort ---

  describe("sort", () => {
    it("sorts by completion descending", () => {
      const result = searchSortGames(library, {
        search: "",
        filter: "all",
        sort: "completion",
      });
      expect(result.map((g) => g.appId)).toEqual([2, 1, 3, 4]);
    });

    it("sorts by achievements earned descending", () => {
      const result = searchSortGames(library, {
        search: "",
        filter: "all",
        sort: "achievements",
      });
      expect(result.map((g) => g.achievements.earned)).toEqual([9, 5, 2, 1]);
    });

    it("sorts by name using locale comparison", () => {
      const names = ["banana", "Apple", "cherry"];
      const games = names.map((name, i) =>
        makeGame({ id: String(i), appId: i, name }),
      );
      const result = searchSortGames(games, {
        search: "",
        filter: "all",
        sort: "name",
      });
      expect(result.map((g) => g.name)).toEqual(["Apple", "banana", "cherry"]);
    });

    it("applies search before sorting", () => {
      const result = searchSortGames(library, {
        search: "elden",
        filter: "all",
        sort: "name",
      });
      expect(result.map((g) => g.appId)).toEqual([1, 4]);
    });
  });
});
