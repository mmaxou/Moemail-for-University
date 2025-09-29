-- 创建每日邮件统计表
CREATE TABLE `daily_email_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`max_count` integer DEFAULT 100 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

-- 为日期字段创建唯一索引
CREATE UNIQUE INDEX `daily_email_stats_date_unique` ON `daily_email_stats` (`date`);