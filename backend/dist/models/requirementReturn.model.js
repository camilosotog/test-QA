"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class RequirementReturnModel {
    static async create(data) {
        const sql = `INSERT INTO requirement_returns
      (po_name, task_code, return_reason)
      VALUES (?, ?, ?)`;
        const params = [
            data.po_name,
            data.task_code,
            data.return_reason,
        ];
        const [result] = await db_1.pool.query(sql, params);
        return result.insertId;
    }
    static async getById(id) {
        const sql = 'SELECT * FROM requirement_returns WHERE id = ? AND is_active = 1';
        const [rows] = await db_1.pool.query(sql, [id]);
        if (!rows || rows.length === 0)
            return null;
        return rows[0];
    }
    static async list(filters = {}, limit = 1000) {
        const conditions = ['is_active = 1'];
        const params = [];
        if (filters.po_name) {
            conditions.push('po_name = ?');
            params.push(filters.po_name);
        }
        if (filters.task_code) {
            conditions.push('task_code LIKE ?');
            params.push(`%${filters.task_code}%`);
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql = `SELECT * FROM requirement_returns ${where} ORDER BY created_at DESC LIMIT ${limit}`;
        const [rows] = await db_1.pool.query(sql, params);
        return rows;
    }
    // Obtener devoluciones por rango de fechas (para análisis por mes)
    static async listByDateRange(startDate, endDate) {
        const sql = `SELECT * FROM requirement_returns 
      WHERE is_active = 1 
      AND created_at >= ? 
      AND created_at <= ?
      ORDER BY created_at DESC`;
        const [rows] = await db_1.pool.query(sql, [startDate, endDate]);
        return rows;
    }
    // Obtener estadísticas por PO
    static async getStatisticsByPO() {
        const sql = `SELECT 
      po_name, 
      COUNT(*) as total_returns,
      MONTH(created_at) as month,
      YEAR(created_at) as year
      FROM requirement_returns 
      WHERE is_active = 1
      GROUP BY po_name, MONTH(created_at), YEAR(created_at)
      ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC`;
        const [rows] = await db_1.pool.query(sql);
        return rows;
    }
    // Obtener estadísticas por mes
    static async getStatisticsByMonth(year, month) {
        let sql = `SELECT 
      po_name, 
      COUNT(*) as total_returns,
      MONTH(created_at) as month,
      YEAR(created_at) as year
      FROM requirement_returns 
      WHERE is_active = 1`;
        const params = [];
        if (year && month) {
            sql += ` AND YEAR(created_at) = ? AND MONTH(created_at) = ?`;
            params.push(year, month);
        }
        sql += ` GROUP BY po_name, MONTH(created_at), YEAR(created_at)
      ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC`;
        const [rows] = await db_1.pool.query(sql, params);
        return rows;
    }
    static async update(id, patch) {
        const allowed = ['po_name', 'task_code', 'return_reason'];
        const updates = [];
        const params = [];
        for (const key of allowed) {
            if (key in patch) {
                updates.push(`${key} = ?`);
                params.push(patch[key]);
            }
        }
        if (updates.length === 0)
            return false;
        params.push(id);
        const sql = `UPDATE requirement_returns SET ${updates.join(', ')} WHERE id = ? AND is_active = 1`;
        const [result] = await db_1.pool.query(sql, params);
        return result.affectedRows > 0;
    }
    static async delete(id) {
        const sql = 'UPDATE requirement_returns SET is_active = 0 WHERE id = ?';
        const [result] = await db_1.pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
}
exports.default = RequirementReturnModel;
//# sourceMappingURL=requirementReturn.model.js.map