ALTER TABLE `cotisations` ADD `currency` enum('EUR','XOF') DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE `dons` ADD `currency` enum('EUR','XOF') DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `currency` enum('EUR','XOF') DEFAULT 'EUR' NOT NULL;