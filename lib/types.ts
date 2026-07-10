export type GameFilter = "all" | "owned" | "tracked";

export type DateRange = "7d" | "30d" | "90d" | "1y";

export interface AchievementPair {
  earned: number;
  total: number;
}

export interface GameComparison {
  text: string;
  percent: number;
  isPositive: boolean;
}

export interface Game {
  id: string;
  appId: number;
  name: string;
  hours: number;
  completion: number;
  achievements: AchievementPair;
  comparison: GameComparison;
  image: string;
  owned: boolean;
  tracked: boolean;
  unlocktimes: number[];
}

export interface Friend {
  id: string;
  name: string;
  percent: number;
  avatar: string;
  isYou: boolean;
}

export interface AchievementDataPoint {
  date: string;
  you: number;
  community: number;
}

export interface ComparisonData {
  you: number;
  community: number;
}

export interface Stats {
  achievementsEarned: number;
  achievementsEarnedDelta: number | null;
  avgCompletion: number;
  avgCompletionDelta: number | null;
  gamesOwned: number;
  gamesOwnedDelta: number | null;
  gamesTracked: number;
  perfectGames: number;
}

export type DashboardError = {
  type: "private_profile" | "api_error";
  status?: number;
} | null;

export interface DashboardData {
  stats: Stats;
  achievementSeries: AchievementDataPoint[];
  comparison: ComparisonData;
  friends: Friend[];
  games: Game[];
  error: DashboardError;
}

export interface DashboardQuery {
  filter: GameFilter;
  range: DateRange;
}

// --- Steam Web API raw types ---

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
  has_community_visible_stats: boolean;
}

export interface SteamOwnedGamesResponse {
  response: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

export interface SteamPlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

export interface SteamPlayerAchievementsResponse {
  playerstats: {
    steamID: string;
    gameName: string;
    achievements: SteamPlayerAchievement[];
  };
}

export interface SteamGlobalAchievement {
  name: string;
  percent: number;
}

export interface SteamGlobalAchievementsResponse {
  achievementpercentages: {
    achievements: SteamGlobalAchievement[];
  };
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
}

export interface SteamPlayerSummariesResponse {
  response: {
    players: SteamPlayerSummary[];
  };
}

export interface SteamFriend {
  steamid: string;
  relationship: string;
  friend_since: number;
}

export interface SteamFriendListResponse {
  friendslist: {
    friends: SteamFriend[];
  };
}
