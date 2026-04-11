-- Pi Rewards Table Migration
-- Jalankan ini di phpMyAdmin Hostinger pada database: u386725528_bliyyan

CREATE TABLE IF NOT EXISTS `pi_rewards` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `pi_uid` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 4) NOT NULL,
    `memo` VARCHAR(255) NOT NULL,
    `payment_id` VARCHAR(255) NULL,
    `txid` VARCHAR(255) NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'completed',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `pi_rewards_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert record ke tabel migrations supaya Laravel tidak menjalankan ulang
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_04_11_084750_create_pi_rewards_table', (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations m2)
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_04_11_084750_create_pi_rewards_table'
);
