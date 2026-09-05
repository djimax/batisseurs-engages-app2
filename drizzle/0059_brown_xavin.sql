ALTER TABLE `cotisations` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `cotisations` ADD `antenneId` int;--> statement-breakpoint
ALTER TABLE `cotisations` ADD `analyticCategory` varchar(100);--> statement-breakpoint
ALTER TABLE `depenses` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `depenses` ADD `antenneId` int;--> statement-breakpoint
ALTER TABLE `depenses` ADD `analyticCategory` varchar(100);--> statement-breakpoint
ALTER TABLE `dons` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `dons` ADD `antenneId` int;--> statement-breakpoint
ALTER TABLE `dons` ADD `analyticCategory` varchar(100);