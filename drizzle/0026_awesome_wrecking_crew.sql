CREATE TABLE `assemblies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('ordinary','extraordinary') NOT NULL DEFAULT 'ordinary',
	`status` enum('draft','scheduled','open','closed','archived') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`opensAt` timestamp,
	`closesAt` timestamp,
	`quorumPercentage` int NOT NULL DEFAULT 50,
	`minutes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `assembly_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assemblyId` int NOT NULL,
	`memberId` int NOT NULL,
	`attendance` enum('invited','present','absent','represented') NOT NULL DEFAULT 'invited',
	`checkedInAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assembly_participant_unique` UNIQUE(`assemblyId`,`memberId`)
);
--> statement-breakpoint
CREATE TABLE `assembly_proxies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assemblyId` int NOT NULL,
	`representedMemberId` int NOT NULL,
	`proxyMemberId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assembly_proxy_unique` UNIQUE(`assemblyId`,`representedMemberId`)
);
--> statement-breakpoint
CREATE TABLE `assembly_resolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assemblyId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`status` enum('draft','open','closed') NOT NULL DEFAULT 'draft',
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `assembly_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resolutionId` int NOT NULL,
	`memberId` int NOT NULL,
	`choice` enum('for','against','abstain') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assembly_vote_unique` UNIQUE(`resolutionId`,`memberId`)
);
--> statement-breakpoint
CREATE INDEX `assemblies_status_idx` ON `assemblies` (`status`);--> statement-breakpoint
CREATE INDEX `assemblies_scheduled_idx` ON `assemblies` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `assembly_participants_member_idx` ON `assembly_participants` (`memberId`);--> statement-breakpoint
CREATE INDEX `assembly_proxies_proxy_member_idx` ON `assembly_proxies` (`proxyMemberId`);--> statement-breakpoint
CREATE INDEX `assembly_resolutions_assembly_idx` ON `assembly_resolutions` (`assemblyId`);--> statement-breakpoint
CREATE INDEX `assembly_votes_member_idx` ON `assembly_votes` (`memberId`);