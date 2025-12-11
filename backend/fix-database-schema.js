// Script para arreglar el problema de Foreign Keys y procesar los resultados correctamente
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

async function fixDatabaseSchema() {
  try {
    await pool.query('DROP TABLE IF EXISTS postman_assertions');
    await pool.query('DROP TABLE IF EXISTS postman_debug_assertions');
    await pool.query('DROP TABLE IF EXISTS postman_debug_results');

    // 2. Verificar si postman_results existe
    const [tables] = await pool.query("SHOW TABLES LIKE 'postman_results'");
    if (tables.length === 0) {
      await pool.query(`
        CREATE TABLE postman_results (
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
    }

    // 3. Crear tabla de assertions SIN foreign key constraint
    await pool.query(`
      CREATE TABLE postman_assertions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        postman_result_id INT,
        assertion_name VARCHAR(500),
        assertion_description TEXT,
        assertion_status VARCHAR(50),
        error_message TEXT,
        expected_value TEXT,
        actual_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_postman_result_id (postman_result_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Limpiar datos existentes para empezar fresh
    await pool.query('DELETE FROM postman_assertions WHERE 1=1');
    await pool.query('DELETE FROM postman_results WHERE 1=1');

  } catch (error) {
    console.error('❌ Error arreglando esquema:', error);
  } finally {
    await pool.end();
  }
}

fixDatabaseSchema();