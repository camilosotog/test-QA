import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/db";

export interface Return {
  id?: number;
  po_name: string;
  task_code: string;
  return_reason: string;
  created_at?: Date;
  is_active?: number;
}

export class ReturnModel {
  static async create(data: Return): Promise<number> {
    const query = "INSERT INTO requirement_returns (po_name, task_code, return_reason) VALUES (?, ?, ?)";
    const [result] = await pool.query<ResultSetHeader>(query, [
      data.po_name,
      data.task_code,
      data.return_reason
    ]);
    return result.insertId;
  }

  static async getById(id: number): Promise<Return | null> {
    const query = "SELECT * FROM requirement_returns WHERE id = ? AND is_active = 1";
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    return (rows[0] as Return) || null;
  }

  static async list(filters?: { po_name?: string; task_code?: string }, limit: number = 1000): Promise<Return[]> {
    let query = "SELECT * FROM requirement_returns WHERE 1=1";
    const params: any[] = [];

    if (filters?.po_name) {
      query += " AND po_name = ?";
      params.push(filters.po_name);
    }

    if (filters?.task_code) {
      query += " AND task_code LIKE ?";
      params.push(`%${filters.task_code}%`);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Return[];
  }

  static async listByDateRange(startDate: string, endDate: string): Promise<Return[]> {
    const query = "SELECT * FROM requirement_returns WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC";
    const [rows] = await pool.query<RowDataPacket[]>(query, [startDate, endDate]);
    return rows as Return[];
  }

  static async getStatisticsByPO(): Promise<any[]> {
    const query = `
      SELECT 
        po_name,
        COUNT(*) as total_returns,
        MONTH(created_at) as month,
        YEAR(created_at) as year
      FROM requirement_returns 
      GROUP BY po_name, MONTH(created_at), YEAR(created_at)
      ORDER BY year DESC, month DESC, po_name ASC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as any[];
  }

  static async getStatisticsByMonth(year?: number, month?: number): Promise<any[]> {
    let query = `
      SELECT 
        po_name,
        COUNT(*) as total_returns,
        MONTH(created_at) as month,
        YEAR(created_at) as year
      FROM requirement_returns 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (year && month) {
      query += " AND MONTH(created_at) = ? AND YEAR(created_at) = ?";
      params.push(month, year);
    } else if (year) {
      query += " AND YEAR(created_at) = ?";
      params.push(year);
    }

    query += " GROUP BY po_name, MONTH(created_at), YEAR(created_at) ORDER BY po_name ASC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as any[];
  }

  static async update(id: number, patch: Partial<Return>): Promise<boolean> {
    const allowedFields = ["po_name", "task_code", "return_reason"];
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(patch)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const query = `UPDATE requirement_returns SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query<ResultSetHeader>(query, values);

    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "UPDATE requirement_returns SET is_active = 0 WHERE id = ?";
    const [result] = await pool.query<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
  }
}
