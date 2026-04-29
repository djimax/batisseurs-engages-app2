CREATE TABLE `password_reset_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`temporaryPassword` varchar(255),
	`status` enum('pending','completed','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_requests_token_unique` UNIQUE(`token`)
);
