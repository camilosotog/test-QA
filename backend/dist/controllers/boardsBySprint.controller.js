"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardsBySprintId = getBoardsBySprintId;
const db_1 = require("../config/db");
async function getBoardsBySprintId(req, res) {
    await db_1.pool.query('SET SESSION group_concat_max_len = 1000000');
    const sprintId = req.params.sprintId;
    try {
        const [rows] = await db_1.pool.query(`
      SELECT 
        b.*, 
        u1.name as owner_name,
        u2.name as developer_name
      FROM boards b
      LEFT JOIN users u1 ON b.owner_id = u1.id
      LEFT JOIN users u2 ON b.developer_id = u2.id
      WHERE b.sprint_id = ?
      ORDER BY b.created_at DESC
    `, [sprintId]);
        res.json(rows);
    }
    catch (err) {
        console.error("Error getBoardsBySprintId:", err);
        res.status(500).json({ error: "Error al obtener boards del sprint" });
    }
}
//# sourceMappingURL=boardsBySprint.controller.js.map