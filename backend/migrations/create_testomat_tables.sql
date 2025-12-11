-- ============================================
-- 🧪 MÓDULO TESTOMAT - GESTIÓN DE CASOS DE PRUEBA
-- ============================================

-- 1. PROYECTOS DE PRUEBA (vinculados a proyectos existentes)
CREATE TABLE IF NOT EXISTS test_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  project_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 2. SUITES DE PRUEBA (agrupaciones de casos)
CREATE TABLE IF NOT EXISTS test_suites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive', 'deprecated') DEFAULT 'active',
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_suite_per_project (test_project_id, name)
);

-- 3. CASOS DE PRUEBA
CREATE TABLE IF NOT EXISTS test_cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_suite_id INT NOT NULL,
  test_project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preconditions TEXT,
  steps JSON,
  expected_result TEXT,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('draft', 'ready', 'deprecated') DEFAULT 'draft',
  automation_status ENUM('manual', 'automated', 'semi-automated') DEFAULT 'manual',
  automation_tool VARCHAR(100),
  test_type ENUM('functional', 'regression', 'smoke', 'integration', 'performance', 'security') DEFAULT 'functional',
  requirement_id VARCHAR(255),
  tags JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
  FOREIGN KEY (test_project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. EJECUCIONES DE CASOS (separadas de resultados)
CREATE TABLE IF NOT EXISTS test_executions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_project_id INT NOT NULL,
  execution_name VARCHAR(255),
  execution_status ENUM('pending', 'in_progress', 'completed', 'aborted') DEFAULT 'pending',
  environment VARCHAR(100),
  executor_id INT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  total_cases INT DEFAULT 0,
  passed_cases INT DEFAULT 0,
  failed_cases INT DEFAULT 0,
  skipped_cases INT DEFAULT 0,
  blocked_cases INT DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (executor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. RESULTADOS DE EJECUCIÓN (detalles de cada caso ejecutado)
CREATE TABLE IF NOT EXISTS test_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_execution_id INT NOT NULL,
  test_case_id INT NOT NULL,
  test_project_id INT NOT NULL,
  result_status ENUM('pass', 'fail', 'skip', 'blocked') DEFAULT 'skip',
  execution_time INT,
  error_message TEXT,
  actual_result TEXT,
  screenshot_url VARCHAR(500),
  log_url VARCHAR(500),
  executed_by INT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (test_project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_execution (test_execution_id),
  INDEX idx_case (test_case_id),
  INDEX idx_project (test_project_id)
);

-- 6. IMPORTACIONES DE TESTOMAT.IO
CREATE TABLE IF NOT EXISTS testomat_imports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_project_id INT NOT NULL,
  import_source VARCHAR(100),
  total_imported INT DEFAULT 0,
  total_suites INT DEFAULT 0,
  total_cases INT DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  mapping_config JSON,
  imported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_project_id) REFERENCES test_projects(id) ON DELETE CASCADE
);

-- 7. HISTORIAL DE CAMBIOS (auditoría)
CREATE TABLE IF NOT EXISTS test_case_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_case_id INT NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);
