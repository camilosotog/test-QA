"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserModel {
    static async getAll() {
        const [rows] = await db_1.pool.query('SELECT id, email, name, user_role, online FROM users');
        return rows;
    }
    static async getOnline() {
        const [rows] = await db_1.pool.query('SELECT id, email, name, user_role, online FROM users WHERE online = 1');
        return rows;
    }
    static async getById(id) {
        const [rows] = await db_1.pool.query('SELECT id, email, name, user_role, online FROM users WHERE id = ?', [id]);
        const users = rows;
        return users[0] || null;
    }
    static async create(user) {
        const { email, name, password, user_role } = user;
        // Hash de la contraseña antes de guardar
        const hash = await bcrypt_1.default.hash(password, 10);
        const [result] = await db_1.pool.query('INSERT INTO users (email, name, password, user_role) VALUES (?, ?, ?, ?)', [email, name, hash, user_role]);
        return result;
    }
    static async update(id, user) {
        const { email, name, password, user_role, online } = user;
        let query = '';
        let params = [];
        if (password && password.trim() !== '') {
            // Hash de la nueva contraseña antes de guardar
            const hash = await bcrypt_1.default.hash(password, 10);
            query = 'UPDATE users SET email = ?, name = ?, password = ?, user_role = ?, online = ? WHERE id = ?';
            params = [email, name, hash, user_role, online ?? 0, id];
        }
        else {
            query = 'UPDATE users SET email = ?, name = ?, user_role = ?, online = ? WHERE id = ?';
            params = [email, name, user_role, online ?? 0, id];
        }
        const [result] = await db_1.pool.query(query, params);
        return result;
    }
    static async delete(id) {
        const [result] = await db_1.pool.query('DELETE FROM users WHERE id = ?', [id]);
        return result;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=user.model.js.map