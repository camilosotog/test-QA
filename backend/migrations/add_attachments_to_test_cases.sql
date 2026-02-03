-- Agregar campo attachments a test_cases para almacenar archivos adjuntos
-- Primero verificamos si la columna ya existe y solo la agregamos si no existe

SET @dbname = DATABASE();
SET @tablename = "test_cases";
SET @columnname = "attachments";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " JSON COMMENT 'Array de URLs de archivos adjuntos: [{\"name\": \"archivo.pdf\", \"url\": \"https://...\"}]'")
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

