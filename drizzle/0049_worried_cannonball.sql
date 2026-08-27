ALTER TABLE `documents` ADD `retentionUntil` bigint;--> statement-breakpoint
ALTER TABLE `documents` ADD `legalHold` boolean DEFAULT false NOT NULL;