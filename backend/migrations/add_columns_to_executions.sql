-- Agregar columnas a test_executions
ALTER TABLE test_executions ADD COLUMN test_suite_id INT DEFAULT NULL AFTER test_project_id;
ALTER TABLE test_executions ADD COLUMN executed_by INT DEFAULT NULL AFTER test_suite_id;
ALTER TABLE test_executions ADD COLUMN status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending' AFTER executed_by;

-- Copiar valores de execution_status a status
UPDATE test_executions 
SET status = CASE 
  WHEN execution_status = 'pending' THEN 'pending'
  WHEN execution_status = 'in_progress' THEN 'in_progress'
  WHEN execution_status = 'completed' THEN 'completed'
  WHEN execution_status = 'aborted' THEN 'failed'
  ELSE 'pending'
END
WHERE execution_status IS NOT NULL AND (status IS NULL OR status = 'pending');

-- Agregar nuevas columnas a test_results
ALTER TABLE test_results ADD COLUMN notes TEXT DEFAULT NULL AFTER error_message;
ALTER TABLE test_results ADD COLUMN evidence_urls JSON DEFAULT NULL AFTER log_url;
ALTER TABLE test_results ADD COLUMN tester_name VARCHAR(255) DEFAULT NULL AFTER evidence_urls;
ALTER TABLE test_results ADD COLUMN developer_name VARCHAR(255) DEFAULT NULL AFTER tester_name;
ALTER TABLE test_results ADD COLUMN qa_tested_by VARCHAR(255) DEFAULT NULL AFTER developer_name;
ALTER TABLE test_results ADD COLUMN status ENUM('pass', 'fail', 'blocked', 'skipped') DEFAULT 'pass' AFTER result_status;

-- Copiar valores de result_status a status
UPDATE test_results
SET status = CASE
  WHEN result_status = 'pass' THEN 'pass'
  WHEN result_status = 'fail' THEN 'fail'
  WHEN result_status = 'skip' THEN 'skipped'
  WHEN result_status = 'blocked' THEN 'blocked'
  ELSE 'pass'
END
WHERE result_status IS NOT NULL AND (status IS NULL OR status = 'pass');
