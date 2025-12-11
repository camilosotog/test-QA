/**
 * Script de migración para ejecutar SQL de creación de tablas
 * Uso: npm run migrate
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  } as any);

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../../migrations/create_test_executions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir en múltiples statements (por punto y coma)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await connection.execute(statement);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration };
