"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoard = createBoard;
exports.listBoards = listBoards;
const db_1 = require("../config/db");
const automatedTask_model_1 = require("../models/automatedTask.model");
async function createBoard(req, res) {
    const { name } = req.body;
    const ownerId = req.user.id;
    // Validar que no exista en automated_task
    const existsInAutomated = await automatedTask_model_1.AutomatedTaskModel.findByName(name);
    if (existsInAutomated) {
        return res.status(409).json({ error: 'Este nombre corresponde a una tarea automatizada y no puede usarse como board.' });
    }
    const [result] = await db_1.pool.query("INSERT INTO boards (name, owner_id) VALUES (?, ?)", [name, ownerId]);
    res.json({ id: result.insertId, name, owner_id: ownerId });
}
async function listBoards(req, res) {
    const ownerId = req.user.id;
    const [rows] = await db_1.pool.query("SELECT * FROM boards WHERE owner_id = ?", [ownerId]);
    res.json(rows);
}
//# sourceMappingURL=boards.controller.js.map