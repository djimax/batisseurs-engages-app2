CREATE TABLE `purchase_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseRequestId` int NOT NULL,
	`supplierId` int NOT NULL,
	`quoteNumber` varchar(100),
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL DEFAULT 'EUR',
	`documentUrl` text,
	`validUntil` timestamp,
	`status` enum('pending','selected','rejected') NOT NULL DEFAULT 'pending',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `purchase_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int,
	`projectId` int,
	`requestedBy` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` varchar(20) NOT NULL,
	`currency` enum('EUR','XOF') NOT NULL DEFAULT 'EUR',
	`status` enum('draft','submitted','approved','rejected','ordered','received','paid','cancelled') NOT NULL DEFAULT 'draft',
	`neededBy` timestamp,
	`justification` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`expenseId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`address` text,
	`taxId` varchar(100),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
