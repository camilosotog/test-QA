-- Actualizar test_executions para agregar columnas faltantes
-- Usar DROP y CREATE para evitar errores de "columna ya existe"
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_executions' AND COLUMN_NAME = 'test_suite_id' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_executions ADD COLUMN test_suite_id INT AFTER test_project_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar executed_by
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_executions' AND COLUMN_NAME = 'executed_by' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_executions ADD COLUMN executed_by INT AFTER test_suite_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar status
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_executions' AND COLUMN_NAME = 'status' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_executions ADD COLUMN status ENUM(\'pending\', \'in_progress\', \'completed\', \'failed\') DEFAULT \'pending\' AFTER executed_by', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copiar valores de execution_status a status
UPDATE test_executions 
SET status = CASE 
  WHEN execution_status = 'pending' THEN 'pending'
  WHEN execution_status = 'in_progress' THEN 'in_progress'
  WHEN execution_status = 'completed' THEN 'completed'
  WHEN execution_status = 'aborted' THEN 'failed'
  ELSE 'pending'
END
WHERE status IS NULL OR status = 'pending';

-- Actualizar test_results para agregar nuevos campos
-- Agregar notes
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_results' AND COLUMN_NAME = 'notes' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_results ADD COLUMN notes TEXT AFTER error_message', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar evidence_urls
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_results' AND COLUMN_NAME = 'evidence_urls' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_results ADD COLUMN evidence_urls JSON AFTER log_url', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar tester_name
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_results' AND COLUMN_NAME = 'tester_name' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_results ADD COLUMN tester_name VARCHAR(255) AFTER evidence_urls', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar developer_name
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_results' AND COLUMN_NAME = 'developer_name' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_results ADD COLUMN developer_name VARCHAR(255) AFTER tester_name', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar qa_tested_by
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_results' AND COLUMN_NAME = 'qa_tested_by' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_results ADD COLUMN qa_tested_by VARCHAR(255) AFTER developer_name', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar status a test_results
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_results' AND COLUMN_NAME = 'status' AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@column_exists = 0, 'ALTER TABLE test_results ADD COLUMN status ENUM(\'pass\', \'fail\', \'blocked\', \'skipped\') DEFAULT \'pass\' AFTER result_status', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copiar valores de result_status a status
UPDATE test_results
SET status = CASE
  WHEN result_status = 'pass' THEN 'pass'
  WHEN result_status = 'fail' THEN 'fail'
  WHEN result_status = 'skip' THEN 'skipped'
  WHEN result_status = 'blocked' THEN 'blocked'
  ELSE 'pass'
END
WHERE status IS NULL OR status = 'pass';
