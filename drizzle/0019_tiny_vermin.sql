ALTER TABLE `members` DROP INDEX `members_memberID_unique`;--> statement-breakpoint
ALTER TABLE `adhesions` MODIFY COLUMN `annee` int;--> statement-breakpoint
ALTER TABLE `adhesions` MODIFY COLUMN `montant` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` MODIFY COLUMN `dateAdhesion` timestamp;--> statement-breakpoint
ALTER TABLE `adhesions` MODIFY COLUMN `status` enum('active','expired','pending','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `members` MODIFY COLUMN `gender` enum('1','2','3') NOT NULL;--> statement-breakpoint
ALTER TABLE `members` MODIFY COLUMN `memberID` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `type` enum('annuelle','mensuelle','trimestrielle','semestrielle') DEFAULT 'annuelle' NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `dateDebut` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `modePayment` enum('virement','especes','cheque','carte','autre') DEFAULT 'autre';--> statement-breakpoint
ALTER TABLE `adhesions` ADD `referencePayment` varchar(100);--> statement-breakpoint
ALTER TABLE `adhesions` ADD `datePaiement` timestamp;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `members` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `members` ADD `address` text;--> statement-breakpoint
ALTER TABLE `members` ADD `photo` text;--> statement-breakpoint
ALTER TABLE `members` ADD `profession` varchar(100);--> statement-breakpoint
ALTER TABLE `members` ADD `memberRole` enum('admin','secretary','member') DEFAULT 'member' NOT NULL;