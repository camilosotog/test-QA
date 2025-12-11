// Script para procesar archivo Newman usando el controlador actual
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

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

async function saveAssertions(postmanResultId, assertions) {
  
  for (let j = 0; j < assertions.length; j++) {
    const assertion = assertions[j];
    
    const assertionName = assertion.assertion || `Test ${j + 1}`;
    const assertionStatus = assertion.error ? 'FAIL' : 'PASS';
    const errorMessage = assertion.error ? assertion.error.message : null;
    const errorTest = assertion.error ? assertion.error.test : null;
    
    
    if (assertion.error) {
    }

    try {
      const assertionQuery = `
        INSERT INTO postman_assertions 
        (postman_result_id, assertion_name, assertion_description, assertion_status, error_message, expected_value, actual_value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const truncatedData = [
        postmanResultId,
        (assertionName || '').substring(0, 500),
        (errorTest || '').substring(0, 1000),
        assertionStatus,
        (errorMessage || '').substring(0, 1000),
        (assertion.error ? String(assertion.error.expected || '').substring(0, 1000) : null),
        (assertion.error ? String(assertion.error.actual || '').substring(0, 1000) : null)
      ];

      await pool.execute(assertionQuery, truncatedData);

    } catch (assertionError) {
      console.error(`❌ Error guardando assertion ${j + 1} "${assertionName}":`, assertionError.message);
    }
  }
}

async function processNewmanWithFixedSchema() {
  // Buscar archivo más reciente
  const files = fs.readdirSync(__dirname).filter(f => f.startsWith('newman-results-') && f.endsWith('.json'));
  
  if (files.length === 0) {
    return;
  }

  const latestFile = files.sort().reverse()[0];
  const resultsPath = path.join(__dirname, latestFile);

  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const executions = data.run?.executions || [];
    
    let successCount = 0;

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

      try {
        // Insertar request principal
        const [result] = await pool.execute(`
          INSERT INTO postman_results 
          (test_name, description, status, http_code, response_time, collection_name, environment_name, request_id, execution_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          (item.name || 'Unnamed Test').substring(0, 255),
          (item.description || '').substring(0, 1000),
          status,
          response.code || null,
          response.responseTime || null,
          'Oncredit Yamaha Pre',
          'Pre-produccion',
          `${item.id || item.name}_${i}`,
          i + 1
        ]);

        const insertedId = result.insertId;

        // Procesar assertions
        if (assertions.length > 0) {
          await saveAssertions(insertedId, assertions);
        }

        successCount++;

      } catch (error) {
        console.error(`    ❌ Error guardando:`, error.message);
      }
    }

    // Verificar resultados finales
    const [requestCount] = await pool.execute('SELECT COUNT(*) as total FROM postman_results');
    const [assertionCount] = await pool.execute('SELECT COUNT(*) as total FROM postman_assertions');

  } catch (error) {
    console.error('❌ Error crítico:', error);
  } finally {
    await pool.end();
  }
}

processNewmanWithFixedSchema();