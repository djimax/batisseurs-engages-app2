CREATE TABLE `bank_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalReference` varchar(255) NOT NULL,
	`provider` varchar(60) NOT NULL,
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`status` enum('unmatched','matched','ignored') NOT NULL DEFAULT 'unmatched',
	`stripePaymentId` int,
	`transactionId` int,
	`matchedBy` int,
	`matchedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_reconciliations_external_ref_unique` UNIQUE(`provider`,`externalReference`)
);
--> statement-breakpoint
CREATE INDEX `bank_reconciliations_status_idx` ON `bank_reconciliations` (`status`);--> statement-breakpoint
CREATE INDEX `bank_reconciliations_stripe_payment_idx` ON `bank_reconciliations` (`stripePaymentId`);