import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

export interface RequirementReturn {
  id?: number;
  po_name: string;
  task_code: string;
  return_reason: string;
  created_at?: string;
  is_active?: number;
}

class RequirementReturnModel {
  static async create(data: RequirementReturn): Promise<number> {
    const sql = `INSERT INTO requirement_returns
      (po_name, task_code, return_reason)
      VALUES (?, ?, ?)`;

    const params = [
      data.po_name,
      data.task_code,
      data.return_reason,
    ];

    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.insertId;
  }

  static async getById(id: number): Promise<RequirementReturn | null> {
    const sql = 'SELECT * FROM requirement_returns WHERE id = ? AND is_active = 1';
    const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);
    if (!rows || rows.length === 0) return null;
    return rows[0] as RequirementReturn;
  }

  static async list(filters: Partial<RequirementReturn> = {}, limit: number = 1000): Promise<RequirementReturn[]> {
    const conditions: string[] = ['is_active = 1'];
    const params: any[] = [];

    if (filters.po_name) {
      conditions.push('po_name = ?');
      params.push(filters.po_name);
    }
    if (filters.task_code) {
      conditions.push('task_code LIKE ?');
      params.push(`%${filters.task_code}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM requirement_returns ${where} ORDER BY created_at DESC LIMIT ${limit}`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as RequirementReturn[];
  }

  // Obtener devoluciones por rango de fechas (para análisis por mes)
  static async listByDateRange(startDate: string, endDate: string): Promise<RequirementReturn[]> {
    const sql = `SELECT * FROM requirement_returns 
      WHERE is_active = 1 
      AND created_at >= ? 
      AND created_at <= ?
      ORDER BY created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [startDate, endDate]);
    return rows as RequirementReturn[];
  }

  // Obtener estadísticas por PO
  static async getStatisticsByPO(): Promise<any[]> {
    const sql = `SELECT 
      po_name, 
      COUNT(*) as total_returns,
      MONTH(created_at) as month,
      YEAR(created_at) as year
      FROM requirement_returns 
      WHERE is_active = 1
      GROUP BY po_name, MONTH(created_at), YEAR(created_at)
      ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql);
    return rows as any[];
  }

  // Obtener estadísticas por mes
  static async getStatisticsByMonth(year?: number, month?: number): Promise<any[]> {
    let sql = `SELECT 
      po_name, 
      COUNT(*) as total_returns,
      MONTH(created_at) as month,
      YEAR(created_at) as year
      FROM requirement_returns 
      WHERE is_active = 1`;

    const params: any[] = [];

    if (year && month) {
      sql += ` AND YEAR(created_at) = ? AND MONTH(created_at) = ?`;
      params.push(year, month);
    }

    sql += ` GROUP BY po_name, MONTH(created_at), YEAR(created_at)
      ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as any[];
  }

  static async update(id: number, patch: Partial<RequirementReturn>): Promise<boolean> {
    const allowed = ['po_name', 'task_code', 'return_reason'];
    const updates: string[] = [];
    const params: any[] = [];

    for (const key of allowed) {
      if (key in patch) {
        updates.push(`${key} = ?`);
        params.push((patch as any)[key]);
      }
    }

    if (updates.length === 0) return false;

    params.push(id);
    const sql = `UPDATE requirement_returns SET ${updates.join(', ')} WHERE id = ? AND is_active = 1`;
    const [result] = await pool.query<ResultSetHeader>(sql, params);

    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const sql = 'UPDATE requirement_returns SET is_active = 0 WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default RequirementReturnModel;
