"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = createItem;
exports.listItems = listItems;
const db_1 = require("../config/db");
async function createItem(req, res) {
    const { board_id, title, values } = req.body;
    const [result] = await db_1.pool.query("INSERT INTO items (board_id, title) VALUES (?, ?)", [board_id, title]);
    const itemId = result.insertId;
    if (values?.length) {
        for (const v of values) {
            const [colRows] = await db_1.pool.query("SELECT id FROM board_columns WHERE board_id=? AND slug=?", [board_id, v.slug]);
            const col = colRows[0];
            if (col) {
                await db_1.pool.query("INSERT INTO item_values (item_id, column_id, json_value) VALUES (?, ?, ?)", [itemId, col.id, JSON.stringify(v)]);
            }
        }
    }
    res.json({ id: itemId, board_id, title });
}
async function listItems(req, res) {
    const boardId = req.query.board_id;
    const [rows] = await db_1.pool.query("SELECT * FROM items WHERE board_id = ?", [boardId]);
    res.json(rows);
}
//# sourceMappingURL=items.controller.js.map