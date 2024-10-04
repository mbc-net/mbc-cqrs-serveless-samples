-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `cpk` VARCHAR(191) NOT NULL,
    `csk` VARCHAR(191) NOT NULL,
    `pk` VARCHAR(191) NOT NULL,
    `sk` VARCHAR(191) NOT NULL,
    `tenant_code` VARCHAR(191) NOT NULL,
    `seq` INTEGER NOT NULL DEFAULT 0,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_ip` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_ip` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_at` TIMESTAMP(0) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `due_date` DATETIME(3) NULL,

    INDEX `tasks_tenant_code_name_idx`(`tenant_code`, `name`),
    UNIQUE INDEX `tasks_cpk_csk_key`(`cpk`, `csk`),
    UNIQUE INDEX `tasks_pk_sk_key`(`pk`, `sk`),
    UNIQUE INDEX `tasks_tenant_code_code_key`(`tenant_code`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
