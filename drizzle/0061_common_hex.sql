CREATE TABLE `volunteer_expense_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`projectId` int,
	`antenneId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`expenseType` enum('transport','accommodation','meals','supplies','other') NOT NULL DEFAULT 'other',
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL DEFAULT 'XOF',
	`expenseDate` timestamp NOT NULL,
	`receiptUrl` text,
	`status` enum('draft','submitted','approved','rejected','reimbursed') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`reimbursedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `volunteer_expense_claims_member_idx` ON `volunteer_expense_claims` (`memberId`);--> statement-breakpoint
CREATE INDEX `volunteer_expense_claims_status_idx` ON `volunteer_expense_claims` (`status`);