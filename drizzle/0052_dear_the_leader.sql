CREATE TABLE `event_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`memberId` int NOT NULL,
	`status` enum('registered','attended','cancelled') NOT NULL DEFAULT 'registered',
	`registeredAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`attendedAt` timestamp,
	`note` text,
	`createdBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_registrations_event_member_unique` UNIQUE(`eventId`,`memberId`)
);
--> statement-breakpoint
CREATE INDEX `event_registrations_event_idx` ON `event_registrations` (`eventId`);--> statement-breakpoint
CREATE INDEX `event_registrations_member_idx` ON `event_registrations` (`memberId`);