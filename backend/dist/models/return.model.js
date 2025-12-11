"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnModel = void 0;
const db_1 = require("../config/db");
class ReturnModel {
    static async create(data) {
        const query = "INSERT INTO returns (po_name, task_code, return_reason) VALUES (?, ?, ?)";
        const [result] = await db_1.pool.query(query, [
            data.po_name,
            data.task_code,
            data.return_reason
        ]);
        return result.insertId;
    }
    static async getById(id) {
        const query = "SELECT * FROM returns WHERE id = ? AND is_active = 1";
        const [rows] = await db_1.pool.query(query, [id]);
        return rows[0] || null;
    }
    static async list(filters, limit = 1000) {
        let query = "SELECT * FROM returns WHERE is_active = 1";
        const params = [];
        if (filters?.po_name) {
            query += " AND po_name = ?";
            params.push(filters.po_name);
        }
        if (filters?.task_code) {
            query += " AND task_code LIKE ?";
            params.push(`%${filters.task_code}%`);
        }
        query += " ORDER BY created_at DESC LIMIT ?";
        params.push(limit);
        const [rows] = await db_1.pool.query(query, params);
        return rows;
    }
    static async listByDateRange(startDate, endDate) {
        const query = "SELECT * FROM returns WHERE DATE(created_at) BETWEEN ? AND ? AND is_active = 1 ORDER BY created_at DESC";
        const [rows] = await db_1.pool.query(query, [startDate, endDate]);
        return rows;
    }
    static async getStatisticsByPO() {
        const query = `
      SELECT 
        po_name,
        COUNT(*) as total_returns,
        MONTH(created_at) as month,
        YEAR(created_at) as year
      FROM returns 
      WHERE is_active = 1
      GROUP BY po_name, MONTH(created_at), YEAR(created_at)
      ORDER BY year DESC, month DESC, po_name ASC
    `;
        const [rows] = await db_1.pool.query(query);
        return rows;
    }
    static async getStatisticsByMonth(year, month) {
        let query = `
      SELECT 
        po_name,
        COUNT(*) as total_returns,
        MONTH(created_at) as month,
        YEAR(created_at) as year
      FROM returns 
      WHERE is_active = 1
    `;
        const params = [];
        if (year && month) {
            query += " AND MONTH(created_at) = ? AND YEAR(created_at) = ?";
            params.push(month, year);
        }
        else if (year) {
            query += " AND YEAR(created_at) = ?";
            params.push(year);
        }
        query += " GROUP BY po_name, MONTH(created_at), YEAR(created_at) ORDER BY po_name ASC";
        const [rows] = await db_1.pool.query(query, params);
        return rows;
    }
    static async update(id, patch) {
        const allowedFields = ["po_name", "task_code", "return_reason"];
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(patch)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        if (fields.length === 0)
            return false;
        values.push(id);
        const query = `UPDATE returns SET ${fields.join(", ")} WHERE id = ? AND is_active = 1`;
        const [result] = await db_1.pool.query(query, values);
        return result.affectedRows > 0;
    }
    static async delete(id) {
        const query = "UPDATE returns SET is_active = 0 WHERE id = ? AND is_active = 1";
        const [result] = await db_1.pool.query(query, [id]);
        return result.affectedRows > 0;
    }
}
exports.ReturnModel = ReturnModel;
//# sourceMappingURL=return.model.js.map