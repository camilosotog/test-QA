"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsersByRoles = exports.getUsersByRole = exports.getUsers = exports.getOnlineUsers = void 0;
const getOnlineUsers = async (req, res) => {
    try {
        const users = await user_model_1.UserModel.getOnline();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios online' });
    }
};
exports.getOnlineUsers = getOnlineUsers;
const user_model_1 = require("../models/user.model");
const db_1 = require("../config/db");
const getUsers = async (req, res) => {
    try {
        const users = await user_model_1.UserModel.getAll();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};
exports.getUsers = getUsers;
/**
 * Obtiene usuarios filtrados por rol
 */
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;
        if (!role || !['ADMIN', 'QA', 'DEV'].includes(role)) {
            return res.status(400).json({ error: 'Role inválido. Debe ser: ADMIN, QA o DEV' });
        }
        const [users] = await db_1.db.query('SELECT id, name, email, user_role FROM users WHERE user_role = ? ORDER BY name ASC', [role]);
        res.json(Array.isArray(users) ? users : []);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener usuarios por rol' });
    }
};
exports.getUsersByRole = getUsersByRole;
/**
 * 🚀 OPTIMIZACIÓN: Obtiene usuarios de múltiples roles en una sola consulta
 */
const getUsersByRoles = async (req, res) => {
    try {
        const [users] = await db_1.db.query(`SELECT id, name, email, user_role 
       FROM users 
       WHERE user_role IN ('ADMIN', 'QA', 'DEV') 
       ORDER BY user_role ASC, name ASC`);
        const usersList = Array.isArray(users) ? users : [];
        // Agrupar por rol para facilitar el uso en frontend
        const grouped = {
            qa: usersList.filter(u => u.user_role === 'QA' || u.user_role === 'ADMIN'),
            dev: usersList.filter(u => u.user_role === 'DEV'),
            admin: usersList.filter(u => u.user_role === 'ADMIN')
        };
        res.json(grouped);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener usuarios por roles' });
    }
};
exports.getUsersByRoles = getUsersByRoles;
const getUserById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = await user_model_1.UserModel.getById(id);
        if (!user)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { email, name, password, user_role } = req.body;
        if (!email || !name || !password || !user_role) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const result = await user_model_1.UserModel.create({ email, name, password, user_role });
        res.status(201).json({ id: result.insertId, email, name, user_role });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { email, name, password, user_role } = req.body;
        const result = await user_model_1.UserModel.update(id, { email, name, password, user_role });
        res.json({ message: 'Usuario actualizado', result });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await user_model_1.UserModel.delete(id);
        res.json({ message: 'Usuario eliminado', result });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.controller.js.map