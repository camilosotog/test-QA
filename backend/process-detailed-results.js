// Script para procesar el archivo existente con el nuevo sistema de assertions detalladas
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de DB
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function processNewmanResults() {
  const resultsFile = 'newman-results-1762466128361.json';
  const resultsPath = path.join(__dirname, resultsFile);

  if (!fs.existsSync(resultsPath)) {
    console.error('❌ Archivo no encontrado:', resultsPath);
    return;
  }

  try {
    // Crear las nuevas tablas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS postman_results_detailed (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_name VARCHAR(255),
        description TEXT,
        status VARCHAR(50),
        http_code INT,
        response_time INT,
        collection_name VARCHAR(255),
        environment_name VARCHAR(255),
        request_id VARCHAR(255),
        execution_order INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS postman_assertions_detailed (
        id INT AUTO_INCREMENT PRIMARY KEY,
        postman_result_id INT,
        assertion_name VARCHAR(500),
        assertion_description TEXT,
        assertion_status VARCHAR(50),
        error_message TEXT,
        expected_value TEXT,
        actual_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postman_result_id) REFERENCES postman_results_detailed(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const executions = data.run?.executions || [];
    
    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];
      const item = execution.item || {};
      const response = execution.response || {};
      const assertions = execution.assertions || [];

      // Determinar estado
      let status = 'UNKNOWN';
      if (!response || !response.code) {
        status = 'NO_RESPONSE';
      } else if (response.code >= 200 && response.code < 300) {
        status = 'PASS';
      } else if (response.code >= 400) {
        status = 'FAIL';
      } else if (response.code >= 300 && response.code < 400) {
        status = 'REDIRECT';
      }

      // Verificar assertions
      const hasFailedAssertions = assertions.some(assertion => assertion.error);
      if (hasFailedAssertions) {
        status = 'FAIL';
      }

      // Insertar request principal
      const [result] = await pool.execute(`
        INSERT INTO postman_results_detailed 
        (test_name, description, status, http_code, response_time, collection_name, environment_name, request_id, execution_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.name || 'Unnamed Test',
        item.description || null,
        status,
        response.code || null,
        response.responseTime || null,
        'Oncredit Yamaha Pre',
        'Pre-produccion',
        `${item.id || item.name}_${i}`,
        i + 1
      ]);

      const requestId = result.insertId;

      // Procesar assertions individuales
      if (assertions.length > 0) {
        for (let j = 0; j < assertions.length; j++) {
          const assertion = assertions[j];
          const assertionName = assertion.assertion || `Test ${j + 1}`;
          const assertionStatus = assertion.error ? 'FAIL' : 'PASS';
          const errorMessage = assertion.error ? assertion.error.message : null;

          // Guardar assertion individual
          await pool.execute(`
            INSERT INTO postman_assertions_detailed 
            (postman_result_id, assertion_name, assertion_description, assertion_status, error_message, expected_value, actual_value)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            requestId,
            assertionName,
            assertion.error ? assertion.error.test : null,
            assertionStatus,
            errorMessage,
            assertion.error ? assertion.error.expected : null,
            assertion.error ? assertion.error.actual : null
          ]);
        }
      } else {
        console.log(`    📝 Sin tests individuales`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

processNewmanResults();