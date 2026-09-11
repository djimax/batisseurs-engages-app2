ALTER TABLE `events` ADD `attendanceToken` varchar(128);--> statement-breakpoint
ALTER TABLE `events` ADD `attendanceTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `events` ADD `attendanceTokenRevoked` int DEFAULT 0 NOT NULL;