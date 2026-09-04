CREATE TABLE `project_impact_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`unit` varchar(60) NOT NULL,
	`baselineValue` varchar(30),
	`currentValue` varchar(30) NOT NULL,
	`targetValue` varchar(30),
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`source` varchar(255),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `project_impact_indicators_project_idx` ON `project_impact_indicators` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_impact_indicators_period_idx` ON `project_impact_indicators` (`periodStart`,`periodEnd`);