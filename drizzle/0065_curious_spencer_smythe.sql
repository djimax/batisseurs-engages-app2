ALTER TABLE `assemblies` ADD `attendanceCertificationStatus` enum('uncertified','certified') DEFAULT 'uncertified' NOT NULL;--> statement-breakpoint
ALTER TABLE `assemblies` ADD `attendanceCertifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `assemblies` ADD `attendanceCertifiedBy` int;--> statement-breakpoint
ALTER TABLE `assemblies` ADD `attendanceProofHash` varchar(128);