ALTER TABLE `documents` ADD `fiscalYear` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `antenneId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `funder` varchar(255);--> statement-breakpoint
ALTER TABLE `documents` ADD `confidentiality` enum('internal','restricted','confidential') DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `businessOwnerId` int;