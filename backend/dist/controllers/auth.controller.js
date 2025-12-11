"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
exports.login = login;
exports.register = register;
exports.logoutAll = logoutAll;
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
async function logout(req, res) {
    try {
        // Se espera que el frontend envíe el id del usuario en el body o en el token
        const userId = req.body.id || (req.user && req.user.id);
        if (!userId)
            return res.status(400).json({ error: "Falta id de usuario" });
        await db_1.pool.query("UPDATE users SET online = 0 WHERE id = ?", [userId]);
        server_1.io.emit('onlineUsersChanged');
        res.json({ message: "Logout exitoso" });
    }
    catch (error) {
        res.status(500).json({ error: "Error al hacer logout" });
    }
}
async function login(req, res) {
    const { email, password } = req.body;
    const [rows] = await db_1.pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt_1.default.compare(password, user.password).catch(() => false);
    if (!ok && user.password !== password)
        return res.status(401).json({ error: "Invalid credentials" });
    // Marcar usuario como online
    await db_1.pool.query("UPDATE users SET online = 1 WHERE id = ?", [user.id]);
    server_1.io.emit('onlineUsersChanged');
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.user_role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.user_role } });
}
async function register(req, res) {
    const { email, name, password } = req.body;
    const hash = await bcrypt_1.default.hash(password, 10);
    const rawRole = req.body.user_role ?? req.body.role ?? "USER";
    const userRole = String(rawRole).toUpperCase();
    await db_1.pool.query("INSERT INTO users (email, name, password, user_role) VALUES (?, ?, ?, ?)", [email, name, hash, userRole]);
    res.json({ message: "User registered" });
}
async function logoutAll(req, res) {
    try {
        // Poner online = 0 a todos los usuarios
        await db_1.pool.query("UPDATE users SET online = 0 WHERE online = 1");
        // Emitir evento global para forzar logout en todos los clientes
        server_1.io.emit("forceLogout");
        res.json({ message: "Todos los usuarios cerraron sesión" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al hacer logout global" });
    }
}
//# sourceMappingURL=auth.controller.js.map