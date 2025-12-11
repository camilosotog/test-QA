"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomatedTaskModel = void 0;
const db_1 = require("../config/db");
class AutomatedTaskModel {
    static async findByName(task_name) {
        const [rows] = await db_1.pool.query('SELECT * FROM automated_task WHERE TRIM(UPPER(task_name)) = TRIM(UPPER(?)) LIMIT 1', [task_name]);
        const arr = rows;
        return arr.length > 0 && arr[0] ? arr[0] : null;
    }
    static async getAll() {
        const [rows] = await db_1.pool.query('SELECT * FROM automated_task');
        return rows;
    }
    static async create(task) {
        const { task_name, state, qa } = task;
        const [result] = await db_1.pool.query('INSERT INTO automated_task (task_name, state, qa) VALUES (?, ?, ?)', [task_name, state, qa]);
        return result;
    }
    static async update(id, task) {
        const { task_name, state, qa } = task;
        const [result] = await db_1.pool.query('UPDATE automated_task SET task_name = ?, state = ?, qa = ? WHERE id = ?', [task_name, state, qa, id]);
        return result;
    }
    static async delete(id) {
        const [result] = await db_1.pool.query('DELETE FROM automated_task WHERE id = ?', [id]);
        return result;
    }
}
exports.AutomatedTaskModel = AutomatedTaskModel;
//# sourceMappingURL=automatedTask.model.js.map