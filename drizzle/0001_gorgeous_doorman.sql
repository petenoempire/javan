CREATE TABLE `audioTracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`artist` varchar(255),
	`url` varchar(512) NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`duration` int NOT NULL,
	`genre` varchar(64),
	`isPopular` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audioTracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalViews` int NOT NULL DEFAULT 0,
	`totalLikes` int NOT NULL DEFAULT 0,
	`totalComments` int NOT NULL DEFAULT 0,
	`totalFollowers` int NOT NULL DEFAULT 0,
	`totalShares` int NOT NULL DEFAULT 0,
	`date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creatorAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('photo','video','background') NOT NULL,
	`url` varchar(512) NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`mimeType` varchar(64),
	`fileSize` int,
	`duration` int,
	`width` int,
	`height` int,
	`thumbnail` varchar(512),
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postAudio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`audioId` int NOT NULL,
	`startTime` int NOT NULL DEFAULT 0,
	`volume` decimal(3,2) NOT NULL DEFAULT '1.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postAudio_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caption` text,
	`mediaType` enum('photo','video') NOT NULL,
	`photoUrl` varchar(512),
	`videoUrl` varchar(512),
	`thumbnailUrl` varchar(512),
	`s3Key` varchar(512),
	`duration` int,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`hashtags` json,
	`aiCaption` text,
	`aiHashtags` json,
	`format` enum('photo','video','story','live','duet','template') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);