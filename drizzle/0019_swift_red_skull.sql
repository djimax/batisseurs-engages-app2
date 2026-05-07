ALTER TABLE `members` ADD `memberId` varchar(50);--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_memberId_unique` UNIQUE(`memberId`);