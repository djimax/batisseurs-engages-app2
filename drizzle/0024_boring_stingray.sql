CREATE TABLE `notification_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`cronExpression` varchar(32) NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 1,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_schedules_name_unique` UNIQUE(`name`),
	CONSTRAINT `notification_schedules_task_uid_unique` UNIQUE(`scheduleCronTaskUid`)
);
