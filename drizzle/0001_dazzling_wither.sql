CREATE TABLE `global_game_snapshots` (
	`app_id` integer NOT NULL,
	`date` text NOT NULL,
	`avg_completion` integer NOT NULL,
	PRIMARY KEY(`app_id`, `date`)
);
