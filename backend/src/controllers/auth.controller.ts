
import { pool } from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { io } from "../server";

export async function logout(req: any, res: any) {
  try {
    // Se espera que el frontend envíe el id del usuario en el body o en el token
    const userId = req.body.id || (req.user && req.user.id);
    if (!userId) return res.status(400).json({ error: "Falta id de usuario" });
    await pool.query("UPDATE users SET online = 0 WHERE id = ?", [userId]);
    io.emit('onlineUsersChanged');
    res.json({ message: "Logout exitoso" });
  } catch (error) {
    res.status(500).json({ error: "Error al hacer logout" });
  }
}

export async function login(req: any, res: any) {
  const { email, password } = req.body;

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = (rows as any)[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password).catch(()=>false);
  if (!ok && user.password !== password) return res.status(401).json({ error: "Invalid credentials" });

  // Marcar usuario como online
  await pool.query("UPDATE users SET online = 1 WHERE id = ?", [user.id]);
  io.emit('onlineUsersChanged');

  const token = jwt.sign(
    { id: user.id, role: user.user_role, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.user_role } });
}

export async function register(req: any, res: any) {
  const { email, name, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const rawRole = req.body.user_role ?? req.body.role ?? "USER";
  const userRole = String(rawRole).toUpperCase();

  await pool.query(
    "INSERT INTO users (email, name, password, user_role) VALUES (?, ?, ?, ?)",
    [email, name, hash, userRole]
  );
  res.json({ message: "User registered" });
}

export async function logoutAll(req: any, res: any) {
  try {
    // Poner online = 0 a todos los usuarios
    await pool.query("UPDATE users SET online = 0 WHERE online = 1");

    // Emitir evento global para forzar logout en todos los clientes
    io.emit("forceLogout");

    res.json({ message: "Todos los usuarios cerraron sesión" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al hacer logout global" });
  }
}
