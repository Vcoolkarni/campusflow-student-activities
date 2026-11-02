CREATE TABLE `activity_faculty` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`faculty` text NOT NULL,
	`responsibility` text NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`faculty`) REFERENCES `faculty`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_faculty_unique` ON `activity_faculty` (`activity`,`faculty`,`responsibility`);--> statement-breakpoint
CREATE TABLE `activity_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`resource` text NOT NULL,
	`responsibility` text NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource`) REFERENCES `resource_people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_resource_unique` ON `activity_resources` (`activity`,`resource`,`responsibility`);--> statement-breakpoint
CREATE TABLE `activity_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`class` text NOT NULL,
	`division` text NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_target_unique` ON `activity_targets` (`activity`,`class`,`division`,`program`);--> statement-breakpoint
CREATE TABLE `activity_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`reviewer` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`remarks` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `approval_activity_index` ON `activity_approvals` (`activity`);--> statement-breakpoint
CREATE TABLE `faculty` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`employee_id` text NOT NULL,
	`email` text NOT NULL,
	`department` text NOT NULL,
	`designation` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faculty_employee_id_unique` ON `faculty` (`employee_id`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`student` text NOT NULL,
	`rating` integer NOT NULL,
	`comments` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_unique` ON `feedback` (`activity`,`student`);--> statement-breakpoint
CREATE TABLE `account_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`department` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_assignments_email_unique` ON `account_assignments` (`email`);--> statement-breakpoint
CREATE TABLE `master_data` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`parent` text DEFAULT '' NOT NULL,
	`department` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `master_value_unique` ON `master_data` (`kind`,`name`,`department`);--> statement-breakpoint
CREATE TABLE `resource_people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`designation` text DEFAULT '' NOT NULL,
	`organization` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`mobile` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`expertise` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `departments` ADD `active` integer DEFAULT 1 NOT NULL;