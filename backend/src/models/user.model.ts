
import { Pool } from 'mysql2/promise';
import { pool } from '../config/db';
import bcrypt from 'bcrypt';

export interface User {
  id?: number;
  email: string;
  name: string;
  password: string;
  user_role: string;
  online?: boolean;
}

export class UserModel {
  static async getAll(): Promise<User[]> {
    const [rows] = await pool.query('SELECT id, email, name, user_role, online FROM users');
    return rows as User[];
  }

  static async getOnline(): Promise<User[]> {
    const [rows] = await pool.query('SELECT id, email, name, user_role, online FROM users WHERE online = 1');
    return rows as User[];
  }

  static async getById(id: number): Promise<User | null> {
  const [rows] = await pool.query('SELECT id, email, name, user_role, online FROM users WHERE id = ?', [id]);
  const users = rows as User[];
  return users[0] || null;
  }

  static async create(user: User): Promise<any> {
    const { email, name, password, user_role } = user;
    // Hash de la contraseña antes de guardar
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, name, password, user_role) VALUES (?, ?, ?, ?)', [email, name, hash, user_role]);
    return result;
  }

  static async update(id: number, user: Partial<User>): Promise<any> {
    const { email, name, password, user_role, online } = user;
    let query = '';
    let params: any[] = [];
    if (password && password.trim() !== '') {
      // Hash de la nueva contraseña antes de guardar
      const hash = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET email = ?, name = ?, password = ?, user_role = ?, online = ? WHERE id = ?';
      params = [email, name, hash, user_role, online ?? 0, id];
    } else {
      query = 'UPDATE users SET email = ?, name = ?, user_role = ?, online = ? WHERE id = ?';
      params = [email, name, user_role, online ?? 0, id];
    }
    const [result] = await pool.query(query, params);
    return result;
  }

  static async delete(id: number): Promise<any> {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result;
  }
}
