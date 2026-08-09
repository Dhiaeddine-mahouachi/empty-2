ALTER TABLE `projects` ADD `details_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `payment_status` text DEFAULT 'unpaid' NOT NULL;