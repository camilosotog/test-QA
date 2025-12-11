"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBug = exports.updateBug = exports.createBug = exports.getBugById = exports.listBugs = void 0;
const bug_model_1 = __importDefault(require("../models/bug.model"));
const listBugs = async (req, res) => {
    try {
        const filters = {};
        if (req.query.reporter_id)
            filters.reporter_id = Number(req.query.reporter_id);
        if (req.query.assignee_id)
            filters.assignee_id = Number(req.query.assignee_id);
        if (req.query.status)
            filters.status = String(req.query.status);
        if (req.query.sprint_id)
            filters.sprint_id = Number(req.query.sprint_id);
        const bugs = await bug_model_1.default.list(filters);
        res.json(bugs);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al listar bugs' });
    }
};
exports.listBugs = listBugs;
const getBugById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const bug = await bug_model_1.default.getById(id);
        if (!bug)
            return res.status(404).json({ error: 'Bug no encontrado' });
        res.json(bug);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener bug' });
    }
};
exports.getBugById = getBugById;
const createBug = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || !payload.title) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        // Si no viene reporter_id en el payload y el usuario está autenticado,
        // usar su id como reporter_id. Si el payload ya especifica reporter_id,
        // respetarlo (permitir reportar en nombre de otro QA desde UI).
        const user = req.user;
        if ((!payload.reporter_id || payload.reporter_id === null) && user && user.id) {
            payload.reporter_id = user.id;
        }
        const id = await bug_model_1.default.create(payload);
        res.status(201).json({ id });
    }
    catch (error) {
        console.error('Error creando bug:', error);
        const message = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ error: 'Error al crear bug', details: message });
    }
};
exports.createBug = createBug;
const updateBug = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const patch = req.body;
        const ok = await bug_model_1.default.update(id, patch);
        if (!ok)
            return res.status(404).json({ error: 'Bug no encontrado o sin cambios' });
        res.json({ message: 'Bug actualizado' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar bug' });
    }
};
exports.updateBug = updateBug;
const deleteBug = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const ok = await bug_model_1.default.remove(id);
        if (!ok)
            return res.status(404).json({ error: 'Bug no encontrado', id });
        res.json({ message: 'Bug eliminado', id, ok });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar bug' });
    }
};
exports.deleteBug = deleteBug;
//# sourceMappingURL=bugs.controller.js.map