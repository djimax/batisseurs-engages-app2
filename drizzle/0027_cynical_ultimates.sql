CREATE TABLE `project_task_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `project_task_comments_task_idx` ON `project_task_comments` (`taskId`);--> statement-breakpoint
CREATE INDEX `project_task_comments_project_idx` ON `project_task_comments` (`projectId`);