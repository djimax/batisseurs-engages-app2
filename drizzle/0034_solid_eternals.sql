CREATE TABLE `membership_fee_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('standard','etudiant','bienfaiteur','fondateur','actif','honoraire') NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL,
	`amount` varchar(20) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`validFrom` date NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `membership_fee_rules_category_idx` ON `membership_fee_rules` (`category`);--> statement-breakpoint
CREATE INDEX `membership_fee_rules_currency_idx` ON `membership_fee_rules` (`currency`);