import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

export interface Bug {
  id?: number;
  title: string;
  description?: string | null;
  type?: string | null;
  reporter_id?: number | null;
  assignee_id?: number | null;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';
  severity?: 'NO CRITICO' | 'CRITICO';
  steps_to_reproduce?: string | null;
  environment?: string | null;
  attachments?: any; // stored as JSON in DB
  sprint_id?: number | null;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
  is_active?: number;
}

class BugModel {
  static async create(bug: Bug): Promise<number> {
    const sql = `INSERT INTO bugs
      (title, description, type, reporter_id, assignee_id, status, priority, severity, steps_to_reproduce, environment, attachments, sprint_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      bug.title,
      bug.description || null,
      bug.type || 'BUG',
      bug.reporter_id || null,
      bug.assignee_id || null,
      bug.status || 'OPEN',
      bug.priority || 'MEDIA',
      bug.severity || 'NO CRITICO',
      bug.steps_to_reproduce || null,
      bug.environment || null,
      bug.attachments ? JSON.stringify(bug.attachments) : null,
      bug.sprint_id || null,
    ];

    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.insertId;
  }

  static async getById(id: number): Promise<Bug | null> {
    const sql = 'SELECT * FROM bugs WHERE id = ? AND is_active = 1';
    const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0] as any;
    if (row.attachments) {
      try { row.attachments = JSON.parse(row.attachments); } catch (e) { /* keep as-is */ }
    }
    return row as Bug;
  }

  static async list(filters: Partial<Bug> = {}): Promise<Bug[]> {
    const conditions: string[] = ['is_active = 1'];
    const params: any[] = [];

    if (filters.reporter_id) { conditions.push('reporter_id = ?'); params.push(filters.reporter_id); }
    if (filters.assignee_id) { conditions.push('assignee_id = ?'); params.push(filters.assignee_id); }
    if (filters.status) { conditions.push('status = ?'); params.push(filters.status); }
    if (filters.sprint_id) { conditions.push('sprint_id = ?'); params.push(filters.sprint_id); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM bugs ${where} ORDER BY created_at DESC LIMIT 1000`;
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.map((r: any) => {
      if (r.attachments) {
        try { r.attachments = JSON.parse(r.attachments); } catch (e) { }
      }
      return r as Bug;
    });
  }

  static async update(id: number, patch: Partial<Bug>): Promise<boolean> {
  const allowed = ['title','description','type','assignee_id','status','priority','severity','steps_to_reproduce','environment','attachments','sprint_id','is_active','resolved_at'];
    const sets: string[] = [];
    const params: any[] = [];
    for (const k of allowed) {
      if ((patch as any)[k] !== undefined) {
        sets.push(`\`${k}\` = ?`);
        const val = (k === 'attachments' && (patch as any)[k]) ? JSON.stringify((patch as any)[k]) : (patch as any)[k];
        params.push(val);
      }
    }
    if (sets.length === 0) return false;
    params.push(id);
    const sql = `UPDATE bugs SET ${sets.join(', ')} WHERE id = ?`;
    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.affectedRows > 0;
  }

  static async remove(id: number): Promise<boolean> {
    const sql = 'UPDATE bugs SET is_active = 0 WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(sql, [id]);
    try {
    } catch (e) { /* ignore logging issues */ }
    return result.affectedRows > 0;
  }
}

export default BugModel;
