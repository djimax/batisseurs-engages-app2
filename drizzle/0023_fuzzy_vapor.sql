CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inAppEnabled` int NOT NULL DEFAULT 1,
	`emailEnabled` int NOT NULL DEFAULT 1,
	`typePreferences` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD `eventKey` varchar(100);--> statement-breakpoint
ALTER TABLE `notifications` ADD `entityType` varchar(80);--> statement-breakpoint
ALTER TABLE `notifications` ADD `entityId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `dedupeKey` varchar(255);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_dedupe_unique` UNIQUE(`dedupeKey`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`userId`,`isRead`);