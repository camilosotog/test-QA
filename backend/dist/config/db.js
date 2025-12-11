"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
// config/db.ts
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const host = process.env.DB_HOST || "localhost";
const port = parseInt(process.env.DB_PORT || "3306", 10);
const user = process.env.DB_USER || "root";
// OJO: usa el nombre que realmente tienes en Render (DB_PASS o DB_PASSWORD)
const password = process.env.DB_PASS ?? process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME || "test";
// Si tu proveedor exige TLS, pon DB_SSL=1 en Render
const ssl = process.env.DB_SSL
    ? { rejectUnauthorized: false } // si tienes CA, usa { ca: process.env.MYSQL_CA_PEM }
    : undefined;
exports.pool = promise_1.default.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 15000,
    // ssl: { minVersion: 'TLSv1.2' }
});
// Alias para compatibilidad
exports.db = exports.pool;
//# sourceMappingURL=db.js.map