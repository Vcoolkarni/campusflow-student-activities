CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`department` text NOT NULL,
	`year` text NOT NULL,
	`semester` text NOT NULL,
	`class` text NOT NULL,
	`division` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`venue` text NOT NULL,
	`mode` text NOT NULL,
	`coordinator` text NOT NULL,
	`resource` text DEFAULT '' NOT NULL,
	`organization` text DEFAULT '' NOT NULL,
	`objective` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`budget` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`owner` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`user` text NOT NULL,
	`action` text NOT NULL,
	`remarks` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`key` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participation` (
	`id` text PRIMARY KEY NOT NULL,
	`activity` text NOT NULL,
	`student` text NOT NULL,
	`attendance` text DEFAULT 'Registered' NOT NULL,
	`responsibility` text DEFAULT 'Participant' NOT NULL,
	`achievement` text DEFAULT '' NOT NULL,
	`certificate` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_activity_student` ON `participation` (`activity`,`student`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`prn` text NOT NULL,
	`email` text NOT NULL,
	`department` text NOT NULL,
	`class` text NOT NULL,
	`division` text NOT NULL,
	`semester` text NOT NULL,
	`year` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_prn_unique` ON `students` (`prn`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'Student' NOT NULL,
	`department` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
