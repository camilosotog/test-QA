"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateTask = checkDuplicateTask;
exports.createQAItem = createQAItem;
exports.listQAItems = listQAItems;
exports.getQAItem = getQAItem;
exports.updateQAItem = updateQAItem;
exports.deleteQAItem = deleteQAItem;
exports.createSprint = createSprint;
exports.listSprints = listSprints;
exports.getSprint = getSprint;
exports.updateSprint = updateSprint;
exports.deleteSprint = deleteSprint;
exports.getBoardsBySprint = getBoardsBySprint;
exports.getQAStatistics = getQAStatistics;
const db_1 = require("../config/db");
let tableEnsured = false;
async function ensureTable() {
    if (tableEnsured)
        return;
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS sprints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NULL,
      start_date TIMESTAMP NULL,
      finish_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS boards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      owner_id INT NOT NULL,
      test_cases INT NULL,
      developer_id INT NULL,
      state VARCHAR(50) DEFAULT 'Sin iniciar',
      sprint_id INT NULL,
      sprint_prev TINYINT(1) NULL,
      returns INT DEFAULT 0,
      return_date DATE NULL,
      automated_cases INT DEFAULT 0,
      in_testing_age TIMESTAMP NULL,
      estimate DECIMAL(10,2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (developer_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
    tableEnsured = true;
}
async function checkDuplicateTask(req, res) {
    await ensureTable();
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }
    try {
        // Buscar tareas con el mismo nombre
        const [rows] = await db_1.pool.query(`
      SELECT b.*, s.name as sprint_name
      FROM boards b
      LEFT JOIN sprints s ON b.sprint_id = s.id
      WHERE LOWER(TRIM(b.name)) = LOWER(TRIM(?))
      ORDER BY b.created_at DESC
      LIMIT 1
    `, [name]);
        const existingTask = rows[0];
        if (existingTask) {
            return res.json({
                exists: true,
                task: {
                    name: existingTask.name,
                    sprint_name: existingTask.sprint_name || 'Sin Sprint',
                    state: existingTask.state || 'Sin estado'
                }
            });
        }
        return res.json({ exists: false });
    }
    catch (error) {
        console.error('Error checking duplicate task:', error);
        return res.status(500).json({ error: 'Error checking duplicate task' });
    }
}
async function createQAItem(req, res) {
    await ensureTable();
    const { name, test_cases = null, developer_id = null, state = "Sin iniciar", sprint_id = null, sprint_prev = null, returns = 0, return_date = null, automated_cases = 0, in_testing_age = null, estimate = null, } = req.body;
    if (!name)
        return res.status(400).json({ error: "name is required" });
    // Solo mostrar advertencia en frontend, no bloquear creación
    const ownerId = req.user.id; // Usar el ID del usuario autenticado
    const [result] = await db_1.pool.query(`INSERT INTO boards 
      (name, owner_id, test_cases, developer_id, state, sprint_id, sprint_prev, returns, return_date, automated_cases, in_testing_age, estimate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        name,
        ownerId,
        test_cases,
        developer_id,
        state,
        sprint_id,
        sprint_prev === null ? null : (sprint_prev ? 1 : 0),
        returns,
        return_date ? new Date(return_date) : null,
        automated_cases,
        (state && state === 'En pruebas') ? new Date() : null,
        estimate,
    ]);
    const id = result.insertId;
    res.status(201).json({ id, name });
}
async function listQAItems(req, res) {
    await ensureTable();
    const ownerId = req.user.id;
    const [rows] = await db_1.pool.query(`
    SELECT b.*, 
           u1.name as owner_name,
           u2.name as developer_name,
           s.name as sprint_name
    FROM boards b
    LEFT JOIN users u1 ON b.owner_id = u1.id
    LEFT JOIN users u2 ON b.developer_id = u2.id
    LEFT JOIN sprints s ON b.sprint_id = s.id
  `);
    res.json(rows);
}
async function getQAItem(req, res) {
    await ensureTable();
    const { id } = req.params;
    const ownerId = req.user.id;
    const [rows] = await db_1.pool.query(`
    SELECT b.*, 
           u1.name as owner_name,
           u2.name as developer_name,
           s.name as sprint_name
    FROM boards b
    LEFT JOIN users u1 ON b.owner_id = u1.id
    LEFT JOIN users u2 ON b.developer_id = u2.id
    LEFT JOIN sprints s ON b.sprint_id = s.id
    WHERE b.id = ?
  `, [id]);
    const item = rows[0];
    if (!item)
        return res.status(404).json({ error: "Not found" });
    res.json(item);
}
async function updateQAItem(req, res) {
    await ensureTable();
    const { id } = req.params;
    const userId = req.user.id;
    const fields = { ...req.body };
    // Permitir actualizar owner_id si viene en el body
    const allowed = [
        "name",
        "test_cases",
        "developer_id",
        "state",
        "sprint_id",
        "sprint_prev",
        "returns",
        "return_date",
        "automated_cases",
        "owner_id",
        "in_testing_age",
        "estimate"
    ];
    const entries = Object.entries(fields).filter(([k, _]) => allowed.includes(k));
    if (entries.length === 0)
        return res.status(400).json({ error: "No valid fields" });
    // Detectar cambio de estado a 'En pruebas'
    let setClause = entries.map(([k]) => `${k} = ?`).join(", ");
    const dateKeys = new Set(["return_date", "in_testing_age"]);
    const boolKeys = new Set(["sprint_prev"]);
    let values = entries.map(([key, value]) => {
        if (dateKeys.has(key)) {
            return value ? new Date(value) : null;
        }
        if (boolKeys.has(key)) {
            return value === null ? null : (value ? 1 : 0);
        }
        return value;
    });
    // Si el estado está cambiando a 'En pruebas', actualizar in_testing_age
    if (fields.state && fields.state === 'En pruebas') {
        // Obtener el estado anterior y el valor actual de in_testing_age
        const [prevRows] = await db_1.pool.query('SELECT state, in_testing_age FROM boards WHERE id = ?', [id]);
        const prevState = prevRows[0]?.state;
        const prevTestingAge = prevRows[0]?.in_testing_age;
        if (prevState && prevState !== 'En pruebas') {
            // Solo setear si no hay valor previo
            if (!prevTestingAge) {
                setClause += ', in_testing_age = ?';
                values.push(new Date());
            }
        }
    }
    const [result] = await db_1.pool.query(`UPDATE boards SET ${setClause} WHERE id = ?`, [...values, id]);
    // Verificar si realmente se actualizó algo
    const affectedRows = result.affectedRows;
    if (affectedRows === 0) {
        // Verificar si el board existe y pertenece al usuario
        const [checkRows] = await db_1.pool.query('SELECT id, owner_id FROM boards WHERE id = ?', [id]);
        if (checkRows.length === 0) {
            return res.status(404).json({ error: "Board not found" });
        }
        else {
            const board = checkRows[0];
            if (board.owner_id !== userId) {
                return res.status(403).json({ error: "Access denied" });
            }
        }
    }
    res.json({ id, updated: true, affectedRows });
}
async function deleteQAItem(req, res) {
    await ensureTable();
    const { id } = req.params;
    const ownerId = req.user.id;
    const [result] = await db_1.pool.query("DELETE FROM boards WHERE id = ?", [id]);
    const affectedRows = result.affectedRows;
    if (affectedRows === 0) {
        // Verificar si el board existe
        const [checkRows] = await db_1.pool.query('SELECT id, owner_id FROM boards WHERE id = ?', [id]);
        if (checkRows.length === 0) {
            return res.status(404).json({ error: "Board not found" });
        }
    }
    res.json({ id, deleted: true, affectedRows });
}
// Endpoints para Sprints
async function createSprint(req, res) {
    await ensureTable();
    const { name, start_date = null, finish_date = null, } = req.body;
    if (!name)
        return res.status(400).json({ error: "name is required" });
    const [result] = await db_1.pool.query(`INSERT INTO sprints (name, start_date, finish_date) VALUES (?, ?, ?)`, [
        name,
        start_date ? new Date(start_date) : null,
        finish_date ? new Date(finish_date) : null,
    ]);
    const id = result.insertId;
    res.status(201).json({ id, name });
}
async function listSprints(req, res) {
    await ensureTable();
    const [rows] = await db_1.pool.query(`
    SELECT s.*, 
           COUNT(b.id) as boards_count
    FROM sprints s
    LEFT JOIN boards b ON s.id = b.sprint_id
    GROUP BY s.id
    ORDER BY s.start_date DESC
  `);
    res.json(rows);
}
async function getSprint(req, res) {
    await ensureTable();
    const { id } = req.params;
    const [rows] = await db_1.pool.query(`
    SELECT s.*, 
           COUNT(b.id) as boards_count
    FROM sprints s
    LEFT JOIN boards b ON s.id = b.sprint_id
    WHERE s.id = ?
    GROUP BY s.id
  `, [id]);
    const sprint = rows[0];
    if (!sprint)
        return res.status(404).json({ error: "Sprint not found" });
    res.json(sprint);
}
async function updateSprint(req, res) {
    await ensureTable();
    const { id } = req.params;
    const fields = { ...req.body };
    const allowed = ["name", "start_date", "finish_date"];
    const entries = Object.entries(fields).filter(([k, _]) => allowed.includes(k));
    if (entries.length === 0)
        return res.status(400).json({ error: "No valid fields" });
    const setClause = entries
        .map(([k]) => `${k} = ?`)
        .join(", ");
    const dateKeys = new Set(["start_date", "finish_date"]);
    const values = entries.map(([key, value]) => {
        if (dateKeys.has(key)) {
            return value ? new Date(value) : null;
        }
        return value;
    });
    const [result] = await db_1.pool.query(`UPDATE sprints SET ${setClause} WHERE id = ?`, [...values, id]);
    const affectedRows = result.affectedRows;
    if (affectedRows === 0) {
        return res.status(404).json({ error: "Sprint not found" });
    }
    res.json({ id, updated: true });
}
async function deleteSprint(req, res) {
    await ensureTable();
    const { id } = req.params;
    // Primero actualizar boards para quitar la referencia al sprint
    await db_1.pool.query("UPDATE boards SET sprint_id = NULL WHERE sprint_id = ?", [id]);
    // Luego eliminar el sprint
    const [result] = await db_1.pool.query("DELETE FROM sprints WHERE id = ?", [id]);
    const affectedRows = result.affectedRows;
    if (affectedRows === 0) {
        return res.status(404).json({ error: "Sprint not found" });
    }
    res.json({ id, deleted: true });
}
// Endpoint para obtener boards agrupados por sprint
// Helper: normaliza el campo "boards" sin reparsear si ya es array/objeto
function normalizeBoards(val) {
    if (val == null)
        return [];
    if (Array.isArray(val))
        return val;
    if (Buffer.isBuffer(val)) {
        try {
            return JSON.parse(val.toString("utf8")) ?? [];
        }
        catch {
            return [];
        }
    }
    if (typeof val === "string") {
        try {
            return JSON.parse(val) ?? [];
        }
        catch {
            return [];
        }
    }
    if (typeof val === "object")
        return val;
    return [];
}
async function getBoardsBySprint(req, res) {
    await ensureTable();
    try {
        const [rows] = await db_1.pool.query(`
      SELECT 
        s.id AS sprint_id,
        s.name AS sprint_name,
        s.start_date,
        s.finish_date,
        COALESCE(
          JSON_ARRAYAGG(
            CASE 
              WHEN b.id IS NULL THEN NULL
              ELSE JSON_OBJECT(
                'id', b.id,
                'name', b.name,
                'owner_id', b.owner_id,
                'test_cases', b.test_cases,
                'developer_id', b.developer_id,
                'state', b.state,
                'returns', b.returns,
                'return_date', b.return_date,
                'automated_cases', b.automated_cases,
                'created_at', b.created_at,
                'updated_at', b.updated_at,
                'owner_name', u1.name,
                'sprint_prev', b.sprint_prev,
                'developer_name', u2.name,
                'in_testing_age', b.in_testing_age,
                'estimate', b.estimate
              )
            END
          ),
          JSON_ARRAY()
        ) AS boards
      FROM sprints s
      LEFT JOIN boards b   ON s.id = b.sprint_id
      LEFT JOIN users u1   ON b.owner_id = u1.id
      LEFT JOIN users u2   ON b.developer_id = u2.id
      GROUP BY s.id, s.name, s.start_date, s.finish_date
      ORDER BY s.start_date DESC
    `);
        // rows.boards puede venir como array, string, buffer u objeto.
        const processedRows = rows.map(r => {
            const boards = normalizeBoards(r.boards).filter((b) => b && b.id != null);
            return { ...r, boards };
        });
        res.json(processedRows);
    }
    catch (err) {
        console.error("Error getBoardsBySprint:", err);
        res.status(500).json({ error: "Error al obtener boards por sprint" });
    }
}
async function getQAStatistics(req, res) {
    await ensureTable();
    try {
        // Obtener estadísticas por QA y mes basadas en fechas de prueba reales
        const [qaStatsRows] = await db_1.pool.query(`
      SELECT 
        u.name as qa_name,
        u.id as qa_id,
        DATE_FORMAT(
          CASE 
            WHEN b.in_testing_age IS NOT NULL THEN b.in_testing_age
            WHEN b.state IN ('Listo', 'Devuelta') AND b.updated_at IS NOT NULL THEN b.updated_at
            ELSE b.created_at
          END,
          '%Y-%m'
        ) as mes_prueba,
        COUNT(b.id) as tareas_probadas,
        SUM(b.returns) as total_devoluciones,
        AVG(b.returns) as promedio_devoluciones_por_tarea
      FROM boards b
      INNER JOIN users u ON b.owner_id = u.id
      WHERE b.state IN ('En pruebas', 'Listo', 'Devuelta', 'Bloqueado')
      GROUP BY u.id, u.name, mes_prueba
      ORDER BY mes_prueba DESC, u.name
    `);
        // Obtener estadísticas generales por QA
        const [qaGeneralRows] = await db_1.pool.query(`
      SELECT 
        u.name as qa_name,
        u.id as qa_id,
        COUNT(b.id) as total_tareas,
        SUM(b.returns) as total_devoluciones,
        AVG(b.returns) as promedio_devoluciones,
        COUNT(CASE WHEN b.state = 'Listo' THEN 1 END) as tareas_exitosas,
        COUNT(CASE WHEN b.state = 'Devuelta' THEN 1 END) as tareas_devueltas
      FROM boards b
      INNER JOIN users u ON b.owner_id = u.id
      WHERE b.state IN ('En pruebas', 'Listo', 'Devuelta', 'Bloqueado')
      GROUP BY u.id, u.name
      ORDER BY total_tareas DESC
    `);
        // Obtener devoluciones por fecha real de devolución
        const [devolucionesRows] = await db_1.pool.query(`
      SELECT 
        u.name as qa_name,
        u.id as qa_id,
        DATE_FORMAT(
          CASE 
            WHEN b.return_date IS NOT NULL THEN b.return_date
            WHEN b.state = 'Devuelta' AND b.updated_at IS NOT NULL THEN b.updated_at
            ELSE b.updated_at
          END,
          '%Y-%m'
        ) as mes_devolucion,
        COUNT(b.id) as tareas_devueltas,
        SUM(b.returns) as contador_devoluciones
      FROM boards b
      INNER JOIN users u ON b.owner_id = u.id
      WHERE b.returns > 0 OR b.state = 'Devuelta'
      GROUP BY u.id, u.name, mes_devolucion
      ORDER BY mes_devolucion DESC, u.name
    `);
        res.json({
            estadisticasPorMes: qaStatsRows,
            estadisticasGenerales: qaGeneralRows,
            devolucionesPorMes: devolucionesRows
        });
    }
    catch (err) {
        console.error("Error getQAStatistics:", err);
        res.status(500).json({ error: "Error al obtener estadísticas de QA" });
    }
}
//# sourceMappingURL=qaItems.controller.js.map