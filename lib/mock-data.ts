import type {
  AchievementDataPoint,
  DashboardData,
  DateRange,
  Friend,
  Game,
  Stats,
} from "./types";

const FEATURED_GAMES: Game[] = [
  {
    id: "g-1",
    appId: 1245620,
    name: "Elden Ring",
    hours: 120,
    completion: 78,
    achievements: { earned: 42, total: 54 },
    comparison: { text: "You're ahead of", percent: 78, isPositive: true },
    image: "https://placehold.co/120x80/1e293b/3b82f6?text=Elden+Ring",
    owned: true,
    tracked: true,
    unlocktimes: [],
  },
  {
    id: "g-2",
    appId: 292030,
    name: "The Witcher 3: Wild Hunt",
    hours: 98,
    completion: 100,
    achievements: { earned: 78, total: 78 },
    comparison: { text: "You're ahead of", percent: 92, isPositive: true },
    image: "https://placehold.co/120x80/1e293b/ef4444?text=Witcher+3",
    owned: true,
    tracked: true,
    unlocktimes: [],
  },
  {
    id: "g-3",
    appId: 367520,
    name: "Hollow Knight",
    hours: 45,
    completion: 63,
    achievements: { earned: 40, total: 63 },
    comparison: { text: "You're behind", percent: 24, isPositive: false },
    image: "https://placehold.co/120x80/1e293b/a855f7?text=Hollow+Knight",
    owned: true,
    tracked: true,
    unlocktimes: [],
  },
  {
    id: "g-4",
    appId: 413150,
    name: "Stardew Valley",
    hours: 80,
    completion: 85,
    achievements: { earned: 34, total: 40 },
    comparison: { text: "You're ahead of", percent: 65, isPositive: true },
    image: "https://placehold.co/120x80/1e293b/22c55e?text=Stardew+Valley",
    owned: true,
    tracked: true,
    unlocktimes: [],
  },
];

const ADDITIONAL_GAME_NAMES = [
  "Cyberpunk 2077",
  "Hades",
  "Dead Cells",
  "Celeste",
  "Portal 2",
  "Half-Life 2",
  "Terraria",
  "Factorio",
  "Dishonored",
  "BioShock Infinite",
  "Borderlands 2",
  "DOOM Eternal",
  "Sekiro: Shadows Die Twice",
  "Dark Souls III",
  "Baldur's Gate 3",
  "The Elder Scrolls V: Skyrim",
  "Fallout 4",
  "Outer Wilds",
  "Subnautica",
  "Risk of Rain 2",
  "Slay the Spire",
  "Enter the Gungeon",
  "Cuphead",
  "Ori and the Blind Forest",
  "A Short Hike",
  "Firewatch",
  "Journey",
  "Inside",
  "Limbo",
  "The Witness",
];

const PALETTE = [
  "3b82f6",
  "ef4444",
  "a855f7",
  "22c55e",
  "f59e0b",
  "ec4899",
  "14b8a6",
  "6366f1",
];

const PERFECT_COUNT = 11;
const TRACKED_COUNT = 24;

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildMockLibrary(): Game[] {
  const rng = makeRng(12345);
  const generated: Game[] = ADDITIONAL_GAME_NAMES.map((name, i) => {
    const isPerfect = i < PERFECT_COUNT;
    const tracked = i < TRACKED_COUNT;
    const total = 30 + Math.floor(rng() * 51);
    const completion = isPerfect ? 100 : 20 + Math.floor(rng() * 76);
    const earned = Math.round((total * completion) / 100);
    const hours = 10 + Math.floor(rng() * 141);
    const ahead = completion >= 45;
    const compPercent = ahead
      ? 50 + Math.floor(rng() * 40)
      : 10 + Math.floor(rng() * 30);
    return {
      id: `g-${i + 5}`,
      appId: 1000000 + i,
      name,
      hours,
      completion,
      achievements: { earned, total },
      comparison: {
        text: ahead ? "You're ahead of" : "You're behind",
        percent: compPercent,
        isPositive: ahead,
      },
      image: `https://placehold.co/120x80/1e293b/${PALETTE[i % PALETTE.length]}?text=${encodeURIComponent(name)}`,
      owned: true,
      tracked,
      unlocktimes: [],
    };
  });
  return [...FEATURED_GAMES, ...generated];
}

const MOCK_LIBRARY = buildMockLibrary();

const SERIES_CONFIG: Record<
  DateRange,
  { days: number; points: number; startYou: number; startComm: number }
> = {
  "7d": { days: 7, points: 4, startYou: 74, startComm: 60 },
  "30d": { days: 30, points: 11, startYou: 18, startComm: 12 },
  "90d": { days: 90, points: 13, startYou: 8, startComm: 5 },
  "1y": { days: 365, points: 12, startYou: 0, startComm: 0 },
};

const COMMUNITY_AVG = 45.1;
const PEAK_YOU = 82;
const PEAK_COMMUNITY = 66;

function lerp(a: number, b: number, t: number): number {
  return Math.round((a + (b - a) * t) * 10) / 10;
}

function formatLabel(date: Date, range: DateRange): string {
  if (range === "1y") {
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function generateMockSeries(
  range: DateRange,
  today: Date,
): AchievementDataPoint[] {
  const cfg = SERIES_CONFIG[range];
  const points: AchievementDataPoint[] = [];
  for (let i = 0; i < cfg.points; i++) {
    const t = cfg.points === 1 ? 1 : i / (cfg.points - 1);
    const dayOffset = Math.round(-cfg.days + cfg.days * t);
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    points.push({
      date: formatLabel(date, range),
      you: lerp(cfg.startYou, PEAK_YOU, t),
      community: lerp(cfg.startComm, PEAK_COMMUNITY, t),
    });
  }
  return points;
}

export function mockComputeStats(games: Game[]): Stats {
  const achievementsEarned = games.reduce(
    (sum, g) => sum + g.achievements.earned,
    0,
  );
  const avgCompletion =
    games.length === 0
      ? 0
      : Math.round(
          (games.reduce((sum, g) => sum + g.completion, 0) / games.length) *
            10,
        ) / 10;
  return {
    achievementsEarned,
    achievementsEarnedDelta: 32,
    avgCompletion,
    avgCompletionDelta: 4.7,
    gamesOwned: games.filter((g) => g.owned).length,
    gamesOwnedDelta: 1,
    gamesTracked: games.filter((g) => g.tracked).length,
    perfectGames: games.filter((g) => g.completion >= 100).length,
  };
}

function buildMockFriends(youPercent: number): Friend[] {
  const others = [
    { name: "Dreadnought", percent: 58.7, avatar: "Dreadnought" },
    { name: "PixelPirate", percent: 48.2, avatar: "PixelPirate" },
    { name: "QuestMaster", percent: 44.9, avatar: "QuestMaster" },
    { name: "NoobSlayer", percent: 32.1, avatar: "NoobSlayer" },
  ];
  return [
    {
      id: "f-you",
      name: "GamerSlayer (You)",
      percent: youPercent,
      avatar: "GamerSlayer",
      isYou: true,
    },
    ...others.map((f, i) => ({
      id: `f-${i + 1}`,
      ...f,
      isYou: false,
    })),
  ];
}

export function getMockDashboardData({
  filter = "all",
  range = "30d",
  today = new Date(),
}: {
  filter?: "all" | "owned" | "tracked";
  range?: DateRange;
  today?: Date;
} = {}): DashboardData {
  let filtered = MOCK_LIBRARY;
  if (filter === "owned") {
    filtered = filtered.filter((g) => g.owned);
  } else if (filter === "tracked") {
    filtered = filtered.filter((g) => g.tracked);
  }
  const stats = mockComputeStats(filtered);
  const achievementSeries = generateMockSeries(range, today);
  const comparison = { you: stats.avgCompletion, community: COMMUNITY_AVG };
  const friends = buildMockFriends(stats.avgCompletion);
  const games = [...filtered].sort((a, b) => b.hours - a.hours);
  return { stats, achievementSeries, comparison, friends, games, error: null };
}

export { MOCK_LIBRARY, buildMockFriends, generateMockSeries, formatLabel };
