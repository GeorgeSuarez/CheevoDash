CREATE TABLE `library_snapshots` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL
);
