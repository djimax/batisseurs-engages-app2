CREATE TABLE IF NOT EXISTS `antennes` (
`id` int AUTO_INCREMENT NOT NULL,
`name` varchar(255) NOT NULL,
`slug` varchar(255) NOT NULL,
`description` text,
`city` varchar(100) NOT NULL,
`address` text,
`phone` varchar(20),
`email` varchar(320),
`responsibleId` int,
`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `antennes_id` PRIMARY KEY(`id`),
CONSTRAINT `antennes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `groupe_members` (
`id` int AUTO_INCREMENT NOT NULL,
`groupeId` int NOT NULL,
`memberId` int NOT NULL,
`role` enum('leader','coordinator','member') NOT NULL DEFAULT 'member',
`joinedAt` timestamp NOT NULL DEFAULT (now()),
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `groupe_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `groupes` (
`id` int AUTO_INCREMENT NOT NULL,
`name` varchar(255) NOT NULL,
`slug` varchar(255) NOT NULL,
`description` text,
`antenneId` int,
`responsibleId` int,
`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `groupes_id` PRIMARY KEY(`id`),
CONSTRAINT `groupes_slug_unique` UNIQUE(`slug`)
);
