ALTER TABLE `activities` ADD `duplicate_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `activity_duplicate_key_unique` ON `activities` (`duplicate_key`) WHERE "activities"."duplicate_key" <> '';--> statement-breakpoint
CREATE INDEX `activity_department_year_index` ON `activities` (`department`,`year`);--> statement-breakpoint
CREATE INDEX `activity_start_index` ON `activities` (`start`);