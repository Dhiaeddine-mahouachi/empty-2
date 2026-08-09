CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`template_id` text NOT NULL,
	`language` text DEFAULT 'tr' NOT NULL,
	`business_name` text NOT NULL,
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`primary_color` text DEFAULT '#a3ff12' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`contact_name` text NOT NULL,
	`offers_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`owner_note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`approved_at` text,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);