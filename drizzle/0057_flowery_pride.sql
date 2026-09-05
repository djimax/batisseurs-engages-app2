CREATE TABLE `campaign_contributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`displayName` varchar(160),
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL DEFAULT 'EUR',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`reference` varchar(120) NOT NULL,
	`paymentProvider` varchar(60),
	`paymentReference` varchar(255),
	`contributionDate` timestamp NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_contributions_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `publicToken` varchar(64);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `publicEnabled` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `campaign_contributions_campaign_idx` ON `campaign_contributions` (`campaignId`);--> statement-breakpoint
CREATE INDEX `campaign_contributions_status_idx` ON `campaign_contributions` (`status`);