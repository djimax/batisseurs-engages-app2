ALTER TABLE `members` ADD `gender` enum('1','2','3') NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `memberID` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_memberID_unique` UNIQUE(`memberID`);