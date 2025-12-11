-- Crear tabla de ejecuciones de pruebas
CREATE TABLE IF NOT EXISTS test_executions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_suite_id INT NOT NULL,
  executed_by INT NOT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'in_progress',
  total_cases INT DEFAULT 0,
  passed_cases INT DEFAULT 0,
  failed_cases INT DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
  FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_suite_id (test_suite_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de resultados de casos en ejecuciones
CREATE TABLE IF NOT EXISTS test_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_case_id INT NOT NULL,
  execution_id INT NOT NULL,
  status ENUM('pass', 'fail', 'blocked', 'skipped') DEFAULT 'pass',
  notes TEXT,
  evidence_urls JSON,
  tester_name VARCHAR(255),
  developer_name VARCHAR(255),
  qa_tested_by VARCHAR(255),
  result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
  KEY idx_execution_id (execution_id),
  KEY idx_case_id (test_case_id),
  UNIQUE KEY unique_case_execution (test_case_id, execution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
