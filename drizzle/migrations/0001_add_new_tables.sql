-- Migration: Ajouter les nouvelles tables pour la robustesse
-- Date: 2026-07-04
-- Description: Ajoute les tables antennes, groupes, permissions, projets et tâches
-- sans supprimer les anciennes tables (migration progressive)

-- Créer la table antennes
CREATE TABLE IF NOT EXISTS `antennes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `city` varchar(100) NOT NULL,
  `address` text,
  `phone` varchar(20),
  `email` varchar(320),
  `responsibleId` int,
  `isActive` int DEFAULT 1 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `antennes_slug_unique` (`slug`),
  KEY `antennes_city_idx` (`city`),
  KEY `antennes_responsibleId_idx` (`responsibleId`)
);

-- Créer la table groupes
CREATE TABLE IF NOT EXISTS `groupes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `antenneId` int NOT NULL,
  `responsibleId` int,
  `isActive` int DEFAULT 1 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `groupes_slug_unique` (`slug`),
  KEY `groupes_antenneId_idx` (`antenneId`),
  KEY `groupes_responsibleId_idx` (`responsibleId`),
  CONSTRAINT `groupes_antenneId_fk` FOREIGN KEY (`antenneId`) REFERENCES `antennes` (`id`) ON DELETE CASCADE
);

-- Créer la table permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `resource` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `isSystem` int DEFAULT 0 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_resource_action_unique` (`resource`, `action`),
  KEY `permissions_resource_idx` (`resource`)
);

-- Créer la table role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `roleId` int NOT NULL,
  `permissionId` int NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_unique` (`roleId`, `permissionId`)
);

-- Créer la table projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` enum('planning','active','on-hold','completed','cancelled') DEFAULT 'planning' NOT NULL,
  `startDate` timestamp NOT NULL,
  `endDate` timestamp,
  `budget` decimal(12,2),
  `groupeId` int,
  `antenneId` int,
  `leaderId` int,
  `progress` int DEFAULT 0,
  `createdBy` int NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_status_idx` (`status`),
  KEY `projects_groupeId_idx` (`groupeId`),
  KEY `projects_antenneId_idx` (`antenneId`),
  KEY `projects_leaderId_idx` (`leaderId`),
  CONSTRAINT `projects_groupeId_fk` FOREIGN KEY (`groupeId`) REFERENCES `groupes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_antenneId_fk` FOREIGN KEY (`antenneId`) REFERENCES `antennes` (`id`) ON DELETE SET NULL
);

-- Créer la table tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `projectId` int NOT NULL,
  `status` enum('todo','in-progress','review','done','cancelled') DEFAULT 'todo' NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium' NOT NULL,
  `assignedTo` int,
  `dueDate` timestamp,
  `completedAt` timestamp,
  `createdBy` int NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_projectId_idx` (`projectId`),
  KEY `tasks_status_idx` (`status`),
  KEY `tasks_assignedTo_idx` (`assignedTo`),
  CONSTRAINT `tasks_projectId_fk` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE
);

-- Ajouter les colonnes manquantes à la table members (si elles n'existent pas)
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `memberID` varchar(50);
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `role` varchar(100);
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `photo` text;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `antenneId` int;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `groupeId` int;

-- Ajouter les index manquants
ALTER TABLE `members` ADD UNIQUE KEY IF NOT EXISTS `members_memberID_unique` (`memberID`);
ALTER TABLE `members` ADD KEY IF NOT EXISTS `members_antenneId_idx` (`antenneId`);
ALTER TABLE `members` ADD KEY IF NOT EXISTS `members_groupeId_idx` (`groupeId`);

-- Ajouter les colonnes manquantes à la table adhesions
ALTER TABLE `adhesions` ADD COLUMN IF NOT EXISTS `type` enum('standard','premium','beneficiary') DEFAULT 'standard';

-- Ajouter les index manquants aux tables existantes
ALTER TABLE `adhesions` ADD KEY IF NOT EXISTS `adhesions_memberId_idx` (`memberId`);
ALTER TABLE `adhesions` ADD KEY IF NOT EXISTS `adhesions_status_idx` (`status`);
ALTER TABLE `documents` ADD KEY IF NOT EXISTS `documents_categoryId_idx` (`categoryId`);
ALTER TABLE `documents` ADD KEY IF NOT EXISTS `documents_createdBy_idx` (`createdBy`);
ALTER TABLE `documents` ADD KEY IF NOT EXISTS `documents_isArchived_idx` (`isArchived`);
ALTER TABLE `document_permissions` ADD KEY IF NOT EXISTS `document_permissions_documentId_idx` (`documentId`);
ALTER TABLE `document_permissions` ADD KEY IF NOT EXISTS `document_permissions_memberId_idx` (`memberId`);
ALTER TABLE `activity_logs` ADD KEY IF NOT EXISTS `activity_logs_userId_idx` (`userId`);
ALTER TABLE `notifications` ADD KEY IF NOT EXISTS `notifications_userId_idx` (`userId`);
ALTER TABLE `notifications` ADD KEY IF NOT EXISTS `notifications_isRead_idx` (`isRead`);

-- Mettre à jour le type de la colonne isRead dans notifications (si elle existe)
ALTER TABLE `notifications` MODIFY COLUMN `isRead` int DEFAULT 0;

-- Mettre à jour le type de la colonne isSystem dans roles (si elle existe)
ALTER TABLE `roles` MODIFY COLUMN `isSystem` int DEFAULT 0;

-- Mettre à jour le type de la colonne isSystem dans email_templates (si elle existe)
ALTER TABLE `email_templates` MODIFY COLUMN `isSystem` int DEFAULT 0;
