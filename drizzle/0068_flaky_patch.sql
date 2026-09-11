CREATE TABLE `privacy_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterUserId` int NOT NULL,
	`memberId` int,
	`requestType` enum('access','export','erasure') NOT NULL,
	`status` enum('submitted','in_review','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'submitted',
	`reason` text,
	`decisionReason` text,
	`decidedBy` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `privacy_requests_requester_idx` ON `privacy_requests` (`requesterUserId`);--> statement-breakpoint
CREATE INDEX `privacy_requests_member_idx` ON `privacy_requests` (`memberId`);--> statement-breakpoint
CREATE INDEX `privacy_requests_status_idx` ON `privacy_requests` (`status`);