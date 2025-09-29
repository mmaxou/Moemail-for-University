DROP INDEX IF EXISTS `api_keys_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `name_user_id_unique` ON `api_keys` (`name`,`user_id`);