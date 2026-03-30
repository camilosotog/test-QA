"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class BugModel {
    static async create(bug) {
        const sql = `INSERT INTO bugs
      (title, description, type, reporter_id, assignee_id, status, priority, severity, steps_to_reproduce, environment, attachments, sprint_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`;
        const params = [
            bug.title,
            bug.description || null,
            bug.type || 'BUG',
            bug.reporter_id || null,
            bug.assignee_id || null,
            bug.status || 'OPEN',
            bug.priority || 'MEDIA',
            bug.severity || 'NO CRITICO',
            bug.steps_to_reproduce || null,
            bug.environment || null,
            bug.attachments ? JSON.stringify(bug.attachments) : null,
            bug.sprint_id || null,
        ];
        const [result] = await db_1.pool.query(sql, params);
        return result.insertId;
    }
    static async getById(id) {
        const sql = 'SELECT * FROM bugs WHERE id = ? AND is_active = 1';
        const [rows] = await db_1.pool.query(sql, [id]);
        if (!rows || rows.length === 0)
            return null;
        const row = rows[0];
        if (row.attachments) {
            try {
                row.attachments = JSON.parse(row.attachments);
            }
            catch (e) { /* keep as-is */ }
        }
        return row;
    }
    static async list(filters = {}) {
        const conditions = ['b.is_active = 1'];
        const params = [];
        if (filters.reporter_id) {
            conditions.push('b.reporter_id = ?');
            params.push(filters.reporter_id);
        }
        if (filters.assignee_id) {
            conditions.push('b.assignee_id = ?');
            params.push(filters.assignee_id);
        }
        if (filters.status) {
            conditions.push('b.status = ?');
            params.push(filters.status);
        }
        if (filters.sprint_id) {
            conditions.push('b.sprint_id = ?');
            params.push(filters.sprint_id);
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql = `SELECT b.*, u.name as reporter_name, u.email as reporter_email 
                 FROM bugs b 
                 LEFT JOIN users u ON b.reporter_id = u.id 
                 ${where} ORDER BY b.created_at DESC LIMIT 1000`;
        const [rows] = await db_1.pool.query(sql, params);
        return rows.map((r) => {
            if (r.attachments) {
                try {
                    r.attachments = JSON.parse(r.attachments);
                }
                catch (e) { }
            }
            return r;
        });
    }
    static async update(id, patch) {
        const allowed = ['title', 'description', 'type', 'assignee_id', 'status', 'priority', 'severity', 'steps_to_reproduce', 'environment', 'attachments', 'sprint_id', 'is_active', 'resolved_at'];
        const sets = [];
        const params = [];
        for (const k of allowed) {
            if (patch[k] !== undefined) {
                sets.push(`\`${k}\` = ?`);
                const val = (k === 'attachments' && patch[k]) ? JSON.stringify(patch[k]) : patch[k];
                params.push(val);
            }
        }
        if (sets.length === 0)
            return false;
        params.push(id);
        const sql = `UPDATE bugs SET ${sets.join(', ')} WHERE id = ?`;
        const [result] = await db_1.pool.query(sql, params);
        return result.affectedRows > 0;
    }
    static async remove(id) {
        const sql = 'UPDATE bugs SET is_active = 0 WHERE id = ?';
        const [result] = await db_1.pool.query(sql, [id]);
        try {
        }
        catch (e) { /* ignore logging issues */ }
        return result.affectedRows > 0;
    }
}
exports.default = BugModel;
//# sourceMappingURL=bug.model.js.map