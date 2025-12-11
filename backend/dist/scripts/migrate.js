"use strict";
/**
 * Script de migración para ejecutar SQL de creación de tablas
 * Uso: npm run migrate
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigration = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const runMigration = async () => {
    const connection = await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'test',
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
    });
    try {
        // Leer el archivo SQL
        const sqlPath = path_1.default.join(__dirname, '../../migrations/create_test_executions.sql');
        const sql = fs_1.default.readFileSync(sqlPath, 'utf-8');
        // Dividir en múltiples statements (por punto y coma)
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        for (const statement of statements) {
            await connection.execute(statement);
        }
    }
    catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
    finally {
        await connection.end();
    }
};
exports.runMigration = runMigration;
// Ejecutar si se llama directamente
if (require.main === module) {
    runMigration().catch(console.error);
}
//# sourceMappingURL=migrate.js.map