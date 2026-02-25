import { Request, Response } from 'express';
import BugModel from '../models/bug.model';

export const listBugs = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query.reporter_id) filters.reporter_id = Number(req.query.reporter_id);
    if (req.query.assignee_id) filters.assignee_id = Number(req.query.assignee_id);
    if (req.query.status) filters.status = String(req.query.status);
    if (req.query.sprint_id) filters.sprint_id = Number(req.query.sprint_id);
    const bugs = await BugModel.list(filters);
    res.json(bugs);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar bugs' });
  }
};

export const listBugsByMonth = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query.reporter_id) filters.reporter_id = Number(req.query.reporter_id);
    if (req.query.assignee_id) filters.assignee_id = Number(req.query.assignee_id);
    if (req.query.status) filters.status = String(req.query.status);
    if (req.query.sprint_id) filters.sprint_id = Number(req.query.sprint_id);
    const bugs = await BugModel.list(filters);

    // Agrupar por mes
    const bugsByMonth: { [key: string]: any[] } = {};
    const monthOrder: string[] = [];

    bugs.forEach((bug) => {
      const date = new Date(bug.created_at || new Date());
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = months[date.getMonth()];
      const monthDisplay = `${monthName} ${date.getFullYear()}`;

      if (!bugsByMonth[monthKey]) {
        bugsByMonth[monthKey] = [];
        monthOrder.push(monthKey);
      }
      bugsByMonth[monthKey].push({ ...bug, monthDisplay });
    });

    // Ordenar meses de más reciente a más antiguo
    monthOrder.sort().reverse();

    const result = monthOrder.map((monthKey) => {
      const monthBugs = bugsByMonth[monthKey] || [];
      return {
        monthKey,
        monthDisplay: monthBugs[0]?.monthDisplay || '',
        bugs: monthBugs,
        count: monthBugs.length
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar bugs por mes' });
  }
};

export const getBugById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const bug = await BugModel.getById(id);
    if (!bug) return res.status(404).json({ error: 'Bug no encontrado' });
    res.json(bug);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener bug' });
  }
};

export const createBug = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.title) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    // Si no viene reporter_id en el payload y el usuario está autenticado,
    // usar su id como reporter_id. Si el payload ya especifica reporter_id,
    // respetarlo (permitir reportar en nombre de otro QA desde UI).
    const user = (req as any).user;
    if ((!payload.reporter_id || payload.reporter_id === null) && user && user.id) {
      payload.reporter_id = user.id;
    }
    const id = await BugModel.create(payload);
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creando bug:', error);
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: 'Error al crear bug', details: message });
  }
};

export const updateBug = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const patch = req.body;
    const ok = await BugModel.update(id, patch);
    if (!ok) return res.status(404).json({ error: 'Bug no encontrado o sin cambios' });
    res.json({ message: 'Bug actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar bug' });
  }
};

export const deleteBug = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ok = await BugModel.remove(id);
    if (!ok) return res.status(404).json({ error: 'Bug no encontrado', id });
    res.json({ message: 'Bug eliminado', id, ok });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar bug' });
  }
};
