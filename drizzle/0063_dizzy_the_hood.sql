CREATE TABLE `board_mandates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(100) NOT NULL,
	`memberId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('planned','active','ended','renewal_due') NOT NULL DEFAULT 'planned',
	`appointedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `board_mandates_member_idx` ON `board_mandates` (`memberId`);--> statement-breakpoint
CREATE INDEX `board_mandates_status_idx` ON `board_mandates` (`status`);