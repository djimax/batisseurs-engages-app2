ALTER TABLE `documents` ADD `approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `documents` ADD `approvalComment` text;