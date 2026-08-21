import { describe, it, expect } from "vitest";
import {
  validateSortKey,
  validateHiddenAppIds,
  validateRarityTiers,
} from "@/lib/settings";
import { hideGames } from "@/lib/game-filtering";
import { computeRarityDistribution, DEFAULT_RARITY_TIERS } from "@/lib/dashboard";
import type { Game } from "@/lib/types";

// --- validateSortKey ---

describe("validateSortKey", () => {
  it("accepts every known sort key", () => {
    for (const key of ["playtime", "completion", "achievements", "name"]) {
      expect(validateSortKey(key)).toBe(key);
    }
  });

  it("rejects unknown values", () => {
    expect(validateSortKey("random")).toBeNull();
    expect(validateSortKey("")).toBeNull();
    expect(validateSortKey(42)).toBeNull();
    expect(validateSortKey(null)).toBeNull();
    expect(validateSortKey(undefined)).toBeNull();
  });
});

// --- validateHiddenAppIds ---

describe("validateHiddenAppIds", () => {
  it("accepts an array of non-negative integers", () => {
    expect(validateHiddenAppIds([1, 570, 1245620])).toEqual([1, 570, 1245620]);
    expect(validateHiddenAppIds([])).toEqual([]);
  });

  it("rejects non-arrays", () => {
    expect(validateHiddenAppIds("570")).toBeNull();
    expect(validateHiddenAppIds(570)).toBeNull();
    expect(validateHiddenAppIds(null)).toBeNull();
  });

  it("rejects arrays containing non-integers or negatives", () => {
    expect(validateHiddenAppIds([1.5])).toBeNull();
    expect(validateHiddenAppIds(["570"])).toBeNull();
    expect(validateHiddenAppIds([-1])).toBeNull();
    expect(validateHiddenAppIds([1, null])).toBeNull();
  });
});

// --- validateRarityTiers ---

const validTiers = [
  { tier: "Common", min: 50, max: 100.1, color: "#888" },
  { tier: "Uncommon", min: 25, max: 50, color: "#4ade80" },
  { tier: "Rare", min: 10, max: 25, color: "#60a5fa" },
  { tier: "Very Rare", min: 5, max: 10, color: "#c084fc" },
  { tier: "Ultra Rare", min: 0, max: 5, color: "#fbbf24" },
];

describe("validateRarityTiers", () => {
  it("accepts a well-formed five-tier configuration", () => {
    expect(validateRarityTiers(validTiers)).toEqual(validTiers);
  });

  it("rejects configurations that are not five tiers", () => {
    expect(validateRarityTiers(validTiers.slice(0, 4))).toBeNull();
    expect(validateRarityTiers([...validTiers, validTiers[0]])).toBeNull();
    expect(validateRarityTiers("tiers")).toBeNull();
    expect(validateRarityTiers(null)).toBeNull();
  });

  it("rejects boundaries that are not strictly decreasing", () => {
    const flat = structuredClone(validTiers);
    flat[1].max = flat[0].max;
    expect(validateRarityTiers(flat)).toBeNull();

    const inverted = structuredClone(validTiers);
    inverted[2].min = inverted[2].max;
    expect(validateRarityTiers(inverted)).toBeNull();
  });

  it("rejects gaps between adjacent tiers", () => {
    const gapped = structuredClone(validTiers);
    gapped[1].min = 30;
    expect(validateRarityTiers(gapped)).toBeNull();
  });

  it("rejects out-of-range boundaries", () => {
    const tooHigh = structuredClone(validTiers);
    tooHigh[0].min = 101;
    expect(validateRarityTiers(tooHigh)).toBeNull();

    const tooLow = structuredClone(validTiers);
    tooLow[4].min = -1;
    expect(validateRarityTiers(tooLow)).toBeNull();
  });

  it("rejects missing fields", () => {
    const broken = structuredClone(validTiers);
    delete (broken[0] as Partial<typeof broken[0]>).color;
    expect(validateRarityTiers(broken)).toBeNull();
  });
});

// --- hideGames ---

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

describe("hideGames", () => {
  it("removes games whose appId is hidden, preserving order", () => {
    const games = [
      makeGame({ appId: 1 }),
      makeGame({ appId: 2 }),
      makeGame({ appId: 3 }),
    ];
    const result = hideGames(games, [2]);
    expect(result.map((g) => g.appId)).toEqual([1, 3]);
  });

  it("returns all games when nothing is hidden", () => {
    const games = [makeGame({ appId: 1 })];
    expect(hideGames(games, [])).toHaveLength(1);
  });
});

// --- computeRarityDistribution with custom tiers ---

describe("computeRarityDistribution with configured tiers", () => {
  it("buckets entries using the provided tiers instead of defaults", () => {
    const custom = [
      { tier: "Common", min: 80, max: 100.1, color: "#888" },
      { tier: "Uncommon", min: 60, max: 80, color: "#0a0" },
      { tier: "Rare", min: 40, max: 60, color: "#00a" },
      { tier: "Very Rare", min: 20, max: 40, color: "#a0a" },
      { tier: "Ultra Rare", min: 0, max: 20, color: "#aa0" },
    ];
    const entries = [
      { appId: 1, gameName: "A", apiname: "X", unlocktime: 1, globalPercent: 85 },
      { appId: 1, gameName: "A", apiname: "Y", unlocktime: 2, globalPercent: 65 },
      { appId: 1, gameName: "A", apiname: "Z", unlocktime: 3, globalPercent: 10 },
    ];
    const result = computeRarityDistribution(entries, custom);
    expect(result.find((t) => t.tier === "Common")?.count).toBe(1);
    expect(result.find((t) => t.tier === "Uncommon")?.count).toBe(1);
    expect(result.find((t) => t.tier === "Ultra Rare")?.count).toBe(1);
  });

  it("falls back to the default tiers", () => {
    const entries = [
      { appId: 1, gameName: "A", apiname: "X", unlocktime: 1, globalPercent: 70 },
    ];
    const result = computeRarityDistribution(entries);
    expect(result.find((t) => t.tier === "Common")?.count).toBe(1);
    expect(DEFAULT_RARITY_TIERS).toHaveLength(5);
  });
});
