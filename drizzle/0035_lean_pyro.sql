CREATE TABLE `member_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`score` int NOT NULL,
	`gradeProposed` varchar(100) NOT NULL,
	`responsibilitiesAssigned` text,
	`comments` text NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `member_grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`currentGrade` varchar(100) NOT NULL DEFAULT 'Membre Adhérent',
	`currentResponsibilities` text,
	`lastEvaluationId` int,
	`promotedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `member_grades_memberId_unique` UNIQUE(`memberId`)
);
--> statement-breakpoint
CREATE INDEX `member_evaluations_member_idx` ON `member_evaluations` (`memberId`);