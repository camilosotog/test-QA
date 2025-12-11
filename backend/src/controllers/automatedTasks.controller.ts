export const updateAutomatedTask = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { task_name, state, qa } = req.body;
    if (!task_name || !state) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    await AutomatedTaskModel.update(id, { task_name, state, qa });
    res.json({ id, task_name, state, qa });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar tarea automatizada' });
  }
};

export const deleteAutomatedTask = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await AutomatedTaskModel.delete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tarea automatizada' });
  }
};
import { Request, Response } from 'express';
import { AutomatedTaskModel } from '../models/automatedTask.model';

export const getAutomatedTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await AutomatedTaskModel.getAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tareas automatizadas' });
  }
};

export const createAutomatedTask = async (req: Request, res: Response) => {
  try {
    const { task_name, state, qa } = req.body;
    if (!task_name || !state) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    // Validar duplicado (case-insensitive, sin espacios)
    const existing = await AutomatedTaskModel.findByName(task_name);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una tarea con ese nombre' });
    }
    const result = await AutomatedTaskModel.create({ task_name, state, qa });
    res.status(201).json({ id: result.insertId, task_name, state, qa });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tarea automatizada' });
  }
};
