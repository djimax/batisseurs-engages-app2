CREATE TABLE `stripe_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeEventId` varchar(255) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`status` enum('received','processed','failed') NOT NULL DEFAULT 'received',
	`receivedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`processedAt` timestamp,
	CONSTRAINT `stripe_events_event_id_unique` UNIQUE(`stripeEventId`)
);
--> statement-breakpoint
CREATE TABLE `stripe_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentType` enum('cotisation','don','campagne') NOT NULL,
	`memberId` int,
	`cotisationId` int,
	`donationId` int,
	`campaignId` int,
	`stripeCheckoutSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`status` enum('created','completed','failed','refunded') NOT NULL DEFAULT 'created',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_payments_checkout_session_unique` UNIQUE(`stripeCheckoutSessionId`),
	CONSTRAINT `stripe_payments_payment_intent_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE INDEX `stripe_payments_member_idx` ON `stripe_payments` (`memberId`);--> statement-breakpoint
CREATE INDEX `stripe_payments_campaign_idx` ON `stripe_payments` (`campaignId`);