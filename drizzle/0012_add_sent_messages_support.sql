ALTER TABLE `message` ADD COLUMN `to_address` text;--> statement-breakpoint
ALTER TABLE `message` ADD COLUMN `type` text DEFAULT 'received' NOT NULL;
