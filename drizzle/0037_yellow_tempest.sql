CREATE TABLE `signature_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`createdBy` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`documentHash` varchar(128) NOT NULL,
	`status` enum('pending','partially-signed','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `signature_signers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`memberId` int NOT NULL,
	`signerName` varchar(255) NOT NULL,
	`signerEmail` varchar(320) NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`status` enum('pending','signed','declined') NOT NULL DEFAULT 'pending',
	`typedSignature` varchar(255),
	`signedAt` timestamp,
	`consentAt` timestamp,
	`evidenceHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `signature_requests_document_idx` ON `signature_requests` (`documentId`);--> statement-breakpoint
CREATE INDEX `signature_requests_status_idx` ON `signature_requests` (`status`);--> statement-breakpoint
CREATE INDEX `signature_signers_request_idx` ON `signature_signers` (`requestId`);--> statement-breakpoint
CREATE INDEX `signature_signers_member_idx` ON `signature_signers` (`memberId`);