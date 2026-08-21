CREATE TABLE `association_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`referenceNumber` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`decisionDate` timestamp NOT NULL,
	`signedBy` varchar(255) NOT NULL,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `association_decisions_ref_unique` UNIQUE(`referenceNumber`)
);
--> statement-breakpoint
CREATE TABLE `financial_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL DEFAULT 'EUR',
	`category` varchar(100) NOT NULL,
	`projectId` int,
	`antenneId` int,
	`expenseDate` timestamp NOT NULL,
	`status` enum('pending','approved','rejected','reimbursed') NOT NULL DEFAULT 'pending',
	`receiptUrl` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `member_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`certificateType` enum('membership_card','tax_receipt','attestation') NOT NULL,
	`referenceNumber` varchar(100) NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `member_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`reason` text NOT NULL,
	`changedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `tax_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptNumber` varchar(100) NOT NULL,
	`donorName` varchar(255) NOT NULL,
	`donorEmail` varchar(320),
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL DEFAULT 'EUR',
	`donationDate` timestamp NOT NULL,
	`pdfUrl` text,
	`issuedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `tax_receipts_number_unique` UNIQUE(`receiptNumber`)
);
--> statement-breakpoint
ALTER TABLE `members` ADD `membershipCategory` enum('standard','etudiant','bienfaiteur','fondateur','actif','honoraire') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `skills` text;--> statement-breakpoint
ALTER TABLE `members` ADD `availability` varchar(100);--> statement-breakpoint
CREATE INDEX `member_certificates_member_idx` ON `member_certificates` (`memberId`);--> statement-breakpoint
CREATE INDEX `member_status_history_member_idx` ON `member_status_history` (`memberId`);