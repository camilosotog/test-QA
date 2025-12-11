// config/db.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const host = process.env.DB_HOST || "localhost";
const port = parseInt(process.env.DB_PORT || "3306", 10);
const user = process.env.DB_USER || "root";
// OJO: usa el nombre que realmente tienes en Render (DB_PASS o DB_PASSWORD)
const password = process.env.DB_PASS ?? process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME || "test";

// Si tu proveedor exige TLS, pon DB_SSL=1 en Render
const ssl =
  process.env.DB_SSL
    ? { rejectUnauthorized: false } // si tienes CA, usa { ca: process.env.MYSQL_CA_PEM }
    : undefined;

export const pool = mysql.createPool({
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
export const db = pool;
