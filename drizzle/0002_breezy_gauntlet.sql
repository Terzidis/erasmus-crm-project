CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_deal','deal_won','deal_lost','activity_due','activity_overdue','contact_added','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`link` varchar(512),
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedDealId` int,
	`relatedActivityId` int,
	`relatedContactId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedDealId_deals_id_fk` FOREIGN KEY (`relatedDealId`) REFERENCES `deals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedActivityId_activities_id_fk` FOREIGN KEY (`relatedActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedContactId_contacts_id_fk` FOREIGN KEY (`relatedContactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;