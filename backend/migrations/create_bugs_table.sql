-- Migration: create_bugs_table.sql
-- Crea la tabla 'bugs' para almacenar reportes de bugs

CREATE TABLE IF NOT EXISTS `bugs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `reporter_id` INT DEFAULT NULL,
  `assignee_id` INT DEFAULT NULL,
  `status` ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED','REJECTED') NOT NULL DEFAULT 'OPEN',
  `priority` ENUM('BAJA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
  `severity` ENUM('NO CRITICO','CRITICO') NOT NULL DEFAULT 'NO CRITICO',
  `type` VARCHAR(100) DEFAULT 'BUG',
  `steps_to_reproduce` TEXT DEFAULT NULL,
  `environment` VARCHAR(255) DEFAULT NULL,
  `attachments` LONGTEXT DEFAULT NULL,
  `sprint_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_reporter_id` (`reporter_id`),
  INDEX `idx_assignee_id` (`assignee_id`),
  INDEX `idx_sprint_id` (`sprint_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: Si deseas agregar claves foráneas hacia `users(id)` o `sprints(id)`, puedes hacerlo
-- después de confirmar que las tablas existen y el comportamiento ON DELETE es el deseado.
-- Ejemplo (opcional):
-- ALTER TABLE `bugs` ADD CONSTRAINT `fk_bugs_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
