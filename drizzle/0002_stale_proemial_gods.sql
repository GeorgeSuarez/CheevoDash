CREATE TABLE `user_preferences` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`default_filter` text DEFAULT 'all' NOT NULL,
	`default_range` text DEFAULT '30d' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
