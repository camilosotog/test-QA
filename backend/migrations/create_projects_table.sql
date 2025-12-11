-- ============================================
-- 📋 TABLA PROJECTS - PROYECTOS DEL SISTEMA
-- ============================================

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `status` ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  `start_date` DATE,
  `end_date` DATE,
  `owner_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
)
