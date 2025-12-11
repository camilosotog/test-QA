"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAutomatedTask = exports.getAutomatedTasks = exports.deleteAutomatedTask = exports.updateAutomatedTask = void 0;
const updateAutomatedTask = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { task_name, state, qa } = req.body;
        if (!task_name || !state) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        await automatedTask_model_1.AutomatedTaskModel.update(id, { task_name, state, qa });
        res.json({ id, task_name, state, qa });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al editar tarea automatizada' });
    }
};
exports.updateAutomatedTask = updateAutomatedTask;
const deleteAutomatedTask = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await automatedTask_model_1.AutomatedTaskModel.delete(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar tarea automatizada' });
    }
};
exports.deleteAutomatedTask = deleteAutomatedTask;
const automatedTask_model_1 = require("../models/automatedTask.model");
const getAutomatedTasks = async (req, res) => {
    try {
        const tasks = await automatedTask_model_1.AutomatedTaskModel.getAll();
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener tareas automatizadas' });
    }
};
exports.getAutomatedTasks = getAutomatedTasks;
const createAutomatedTask = async (req, res) => {
    try {
        const { task_name, state, qa } = req.body;
        if (!task_name || !state) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        // Validar duplicado (case-insensitive, sin espacios)
        const existing = await automatedTask_model_1.AutomatedTaskModel.findByName(task_name);
        if (existing) {
            return res.status(409).json({ error: 'Ya existe una tarea con ese nombre' });
        }
        const result = await automatedTask_model_1.AutomatedTaskModel.create({ task_name, state, qa });
        res.status(201).json({ id: result.insertId, task_name, state, qa });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear tarea automatizada' });
    }
};
exports.createAutomatedTask = createAutomatedTask;
//# sourceMappingURL=automatedTasks.controller.js.map