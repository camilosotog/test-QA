"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
/**
 * Ejecutar migraciones SQL desde archivos
 */
async function runMigrations() {
    try {
        const migrationsDir = path_1.default.join(__dirname, '../../migrations');
        // Archivos de migración en orden
        const migrationFiles = [
            'create_projects_table.sql',
            'create_testomat_tables.sql',
            'create_test_executions.sql',
            'add_input_data_to_test_cases.sql',
            'add_columns_to_executions.sql',
            'create_bugs_table.sql',
            'alter_test_executions.sql',
            'add_response_body_to_postman_results.sql',
            'add_project_id_to_playwright.sql',
            'add_last_active_to_users.sql',
            'create_returns_table.sql',
            'create_requirement_returns_table.sql',
            // Agregar más migraciones aquí si es necesario
        ];
        for (const file of migrationFiles) {
            const filePath = path_1.default.join(migrationsDir, file);
            if (!fs_1.default.existsSync(filePath)) {
                continue;
            }
            const sql = fs_1.default.readFileSync(filePath, 'utf-8');
            try {
                // Dividir por punto y coma y ejecutar cada statement
                const statements = sql
                    .split(';')
                    .map(s => {
                    // Remover comentarios de línea (--) y espacios en blanco
                    return s
                        .split('\n')
                        .filter(line => !line.trim().startsWith('--'))
                        .join('\n')
                        .trim();
                })
                    .filter(s => s.length > 0);
                for (const statement of statements) {
                    if (statement.length > 0) {
                        await db_1.db.query(statement);
                    }
                }
            }
            catch (error) {
                // No detener en errores - continuar con otras migraciones
            }
        }
    }
    catch (error) {
        console.error('Error ejecutando migraciones:', error);
    }
}
exports.default = runMigrations;
//# sourceMappingURL=migrations.js.map