-- Migration: create_requirement_returns_table.sql
-- Crea la tabla 'requirement_returns' para registrar devoluciones de análisis de requerimientos por QA

CREATE TABLE IF NOT EXISTS `requirement_returns` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `po_name` VARCHAR(255) NOT NULL,
  `task_code` VARCHAR(100) NOT NULL,
  `return_reason` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_po_name` (`po_name`),
  INDEX `idx_task_code` (`task_code`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
