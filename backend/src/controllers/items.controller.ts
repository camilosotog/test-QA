import { pool } from "../config/db";

export async function createItem(req: any, res: any) {
  const { board_id, title, values } = req.body;

  const [result] = await pool.query(
    "INSERT INTO items (board_id, title) VALUES (?, ?)",
    [board_id, title]
  );
  const itemId = (result as any).insertId;

  if (values?.length) {
    for (const v of values) {
      const [colRows] = await pool.query(
        "SELECT id FROM board_columns WHERE board_id=? AND slug=?",
        [board_id, v.slug]
      );
      const col = (colRows as any)[0];
      if (col) {
        await pool.query(
          "INSERT INTO item_values (item_id, column_id, json_value) VALUES (?, ?, ?)",
          [itemId, col.id, JSON.stringify(v)]
        );
      }
    }
  }

  res.json({ id: itemId, board_id, title });
}

export async function listItems(req: any, res: any) {
  const boardId = req.query.board_id;
  const [rows] = await pool.query(
    "SELECT * FROM items WHERE board_id = ?",
    [boardId]
  );
  res.json(rows);
}
