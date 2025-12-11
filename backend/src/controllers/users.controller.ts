export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.getOnline();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios online' });
  }
};
import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { db } from '../config/db';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/**
 * Obtiene usuarios filtrados por rol
 */
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    if (!role || !['ADMIN', 'QA', 'DEV'].includes(role as string)) {
      return res.status(400).json({ error: 'Role inválido. Debe ser: ADMIN, QA o DEV' });
    }

    const [users] = await db.query(
      'SELECT id, name, email, user_role FROM users WHERE user_role = ? ORDER BY name ASC',
      [role]
    ) as any;

    res.json(Array.isArray(users) ? users : []);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios por rol' });
  }
};

/**
 * 🚀 OPTIMIZACIÓN: Obtiene usuarios de múltiples roles en una sola consulta
 */
export const getUsersByRoles = async (req: Request, res: Response) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, user_role 
       FROM users 
       WHERE user_role IN ('ADMIN', 'QA', 'DEV') 
       ORDER BY user_role ASC, name ASC`
    ) as any;

    const usersList = Array.isArray(users) ? users : [];
    
    // Agrupar por rol para facilitar el uso en frontend
    const grouped = {
      qa: usersList.filter(u => u.user_role === 'QA' || u.user_role === 'ADMIN'),
      dev: usersList.filter(u => u.user_role === 'DEV'),
      admin: usersList.filter(u => u.user_role === 'ADMIN')
    };

    res.json(grouped);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios por roles' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await UserModel.getById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, password, user_role } = req.body;
    if (!email || !name || !password || !user_role) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const result = await UserModel.create({ email, name, password, user_role });
    res.status(201).json({ id: result.insertId, email, name, user_role });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { email, name, password, user_role } = req.body;
    const result = await UserModel.update(id, { email, name, password, user_role });
    res.json({ message: 'Usuario actualizado', result });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await UserModel.delete(id);
    res.json({ message: 'Usuario eliminado', result });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
