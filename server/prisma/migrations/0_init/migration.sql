-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(0) NULL,
    `endDate` DATETIME(0) NULL,
    `status` ENUM('待处理', '进行中', '已完成', '关闭') NULL DEFAULT 待处理,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `createdById`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketNumber` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('紧急', '高', '中', '低') NULL DEFAULT 中,
    `status` ENUM('待处理', '进行中', '已完成', '关闭') NULL DEFAULT 待处理,
    `assigneeId` INTEGER NULL,
    `createdById` INTEGER NOT NULL,
    `comments` JSON NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `ticketNumber`(`ticketNumber`),
    INDEX `assigneeId`(`assigneeId`),
    INDEX `createdById`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255) NOT NULL,
    `email` TEXT NULL,
    `brand` ENUM('EL', 'CL', 'MAC', 'DA', 'LAB', 'OR', 'Dr.jart+', 'IT') NOT NULL,
    `role` ENUM('user', 'admin', 'super_admin') NULL DEFAULT 'user',
    `status` VARCHAR(200) NULL,
    `avatar` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `username`(`username`),
    UNIQUE INDEX `phone`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workitem_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workItemId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `type` ENUM('create', 'update', 'status_change', 'assignee_change', 'comment', 'attachment_add', 'attachment_delete') NOT NULL,
    `field` VARCHAR(255) NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `workitem_activities_created_at`(`createdAt`),
    INDEX `workitem_activities_type`(`type`),
    INDEX `workitem_activities_user_id`(`userId`),
    INDEX `workitem_activities_work_item_id`(`workItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workitems` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('规划', '需求', '事务', '缺陷') NOT NULL,
    `status` ENUM('待处理', '进行中', '已完成', '关闭') NULL DEFAULT 待处理,
    `priority` ENUM('紧急', '高', '中', '低') NULL DEFAULT 中,
    `source` ENUM('内部需求', '品牌需求') NULL,
    `estimatedHours` FLOAT NULL,
    `actualHours` FLOAT NULL,
    `scheduledStartDate` DATETIME(0) NULL,
    `scheduledEndDate` DATETIME(0) NULL,
    `expectedCompletionDate` DATETIME(0) NULL,
    `completionDate` DATETIME(0) NULL,
    `projectId` INTEGER NULL,
    `assigneeId` INTEGER NULL,
    `createdById` INTEGER NOT NULL,
    `attachments` JSON NULL,
    `comments` JSON NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `assigneeId`(`assigneeId`),
    INDEX `createdById`(`createdById`),
    INDEX `projectId`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workitem_activities` ADD CONSTRAINT `workitem_activities_ibfk_1` FOREIGN KEY (`workItemId`) REFERENCES `workitems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workitem_activities` ADD CONSTRAINT `workitem_activities_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workitems` ADD CONSTRAINT `workitems_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workitems` ADD CONSTRAINT `workitems_ibfk_2` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workitems` ADD CONSTRAINT `workitems_ibfk_3` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
