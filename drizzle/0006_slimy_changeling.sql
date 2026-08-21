ALTER TABLE `user_preferences` ADD `default_sort` text DEFAULT 'playtime' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `hidden_app_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `rarity_tiers` text DEFAULT '[]' NOT NULL;