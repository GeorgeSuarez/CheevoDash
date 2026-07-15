import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  steamId: text("steam_id").primaryKey(),
  personaName: text("persona_name").notNull(),
  avatar: text("avatar"),
  level: integer("level").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const trackedGames = sqliteTable(
  "tracked_games",
  {
    steamId: text("steam_id").notNull(),
    appId: integer("app_id").notNull(),
    trackedAt: integer("tracked_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.steamId, table.appId] }),
  }),
);

export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  steamId: text("steam_id").notNull(),
  date: text("date").notNull(),
  achievementsEarned: integer("achievements_earned").notNull(),
  avgCompletion: integer("avg_completion").notNull(),
  gamesOwned: integer("games_owned").notNull(),
});

export const globalGameSnapshots = sqliteTable(
  "global_game_snapshots",
  {
    appId: integer("app_id").notNull(),
    date: text("date").notNull(),
    avgCompletion: integer("avg_completion").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.appId, table.date] }),
  }),
);
