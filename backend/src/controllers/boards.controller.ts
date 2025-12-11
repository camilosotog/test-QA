import { pool } from "../config/db";
import { AutomatedTaskModel } from "../models/automatedTask.model";

export async function createBoard(req: any, res: any) {
  const { name } = req.body;
  const ownerId = req.user.id;

  // Validar que no exista en automated_task
  const existsInAutomated = await AutomatedTaskModel.findByName(name);
  if (existsInAutomated) {
    return res.status(409).json({ error: 'Este nombre corresponde a una tarea automatizada y no puede usarse como board.' });
  }

  const [result] = await pool.query(
    "INSERT INTO boards (name, owner_id) VALUES (?, ?)",
    [name, ownerId]
  );

  res.json({ id: (result as any).insertId, name, owner_id: ownerId });
}

export async function listBoards(req: any, res: any) {
  const ownerId = req.user.id;
  const [rows] = await pool.query("SELECT * FROM boards WHERE owner_id = ?", [ownerId]);
  res.json(rows);
}
