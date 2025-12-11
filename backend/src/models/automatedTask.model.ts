
import { pool } from '../config/db';

export interface AutomatedTask {
  id?: number;
  task_name: string;
  state: string;
  qa?: string;
}

export class AutomatedTaskModel {
  static async findByName(task_name: string): Promise<AutomatedTask | null> {
    const [rows] = await pool.query(
      'SELECT * FROM automated_task WHERE TRIM(UPPER(task_name)) = TRIM(UPPER(?)) LIMIT 1',
      [task_name]
    );
    const arr = rows as AutomatedTask[];
    return arr.length > 0 && arr[0] ? arr[0] : null;
  }
  static async getAll(): Promise<AutomatedTask[]> {
    const [rows] = await pool.query('SELECT * FROM automated_task');
    return rows as AutomatedTask[];
  }
  
  static async create(task: AutomatedTask): Promise<any> {
    const { task_name, state, qa } = task;
    const [result] = await pool.query('INSERT INTO automated_task (task_name, state, qa) VALUES (?, ?, ?)', [task_name, state, qa]);
    return result;
  }
  
  static async update(id: number, task: AutomatedTask): Promise<any> {
    const { task_name, state, qa } = task;
    const [result] = await pool.query(
      'UPDATE automated_task SET task_name = ?, state = ?, qa = ? WHERE id = ?',
      [task_name, state, qa, id]
    );
    return result;
  }

  static async delete(id: number): Promise<any> {
    const [result] = await pool.query('DELETE FROM automated_task WHERE id = ?', [id]);
    return result;
  }
}
