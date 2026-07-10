CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`steam_id` text NOT NULL,
	`date` text NOT NULL,
	`achievements_earned` integer NOT NULL,
	`avg_completion` integer NOT NULL,
	`games_owned` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracked_games` (
	`steam_id` text NOT NULL,
	`app_id` integer NOT NULL,
	`tracked_at` integer NOT NULL,
	PRIMARY KEY(`steam_id`, `app_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`persona_name` text NOT NULL,
	`avatar` text,
	`level` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
