ALTER TABLE `users` ADD `emailNotifyNewDeal` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyDealWon` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyDealLost` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyOverdue` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyActivityDue` boolean DEFAULT true NOT NULL;