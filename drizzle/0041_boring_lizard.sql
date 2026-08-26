CREATE TABLE `document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`contentHash` varchar(128) NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE INDEX `document_versions_document_idx` ON `document_versions` (`documentId`);--> statement-breakpoint
CREATE INDEX `document_versions_document_version_idx` ON `document_versions` (`documentId`,`versionNumber`);