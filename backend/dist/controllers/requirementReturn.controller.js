"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatisticsByMonth = exports.getStatisticsByPO = exports.getReturnsByDateRange = exports.deleteReturn = exports.updateReturn = exports.createReturn = exports.getReturnById = exports.listReturns = void 0;
const requirementReturn_model_1 = __importDefault(require("../models/requirementReturn.model"));
// Lista todas las devoluciones con filtros opcionales
const listReturns = async (req, res) => {
    try {
        const filters = {};
        if (req.query.po_name)
            filters.po_name = String(req.query.po_name);
        if (req.query.task_code)
            filters.task_code = String(req.query.task_code);
        const limit = req.query.limit ? Number(req.query.limit) : 1000;
        const returns = await requirementReturn_model_1.default.list(filters, limit);
        res.json({ success: true, data: returns, message: 'Devoluciones listadas exitosamente' });
    }
    catch (error) {
        console.error('Error listando devoluciones:', error);
        res.status(500).json({ success: false, error: 'Error al listar devoluciones' });
    }
};
exports.listReturns = listReturns;
// Obtiene una devolución por ID
const getReturnById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const requirementReturn = await requirementReturn_model_1.default.getById(id);
        if (!requirementReturn) {
            return res.status(404).json({ success: false, error: 'Devolución no encontrada' });
        }
        res.json({ success: true, data: requirementReturn });
    }
    catch (error) {
        console.error('Error obteniendo devolución:', error);
        res.status(500).json({ success: false, error: 'Error al obtener devolución' });
    }
};
exports.getReturnById = getReturnById;
// Crea una nueva devolución
const createReturn = async (req, res) => {
    try {
        const { po_name, task_code, return_reason } = req.body;
        // Validación de campos requeridos
        if (!po_name || !task_code || !return_reason) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: po_name, task_code, return_reason',
            });
        }
        const payload = {
            po_name,
            task_code,
            return_reason,
        };
        const id = await requirementReturn_model_1.default.create(payload);
        res.status(201).json({
            success: true,
            id,
            message: 'Devolución registrada exitosamente',
        });
    }
    catch (error) {
        console.error('Error creando devolución:', error);
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            success: false,
            error: 'Error al crear devolución',
            details: message,
        });
    }
};
exports.createReturn = createReturn;
// Actualiza una devolución existente
const updateReturn = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const patch = req.body;
        if (Object.keys(patch).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar',
            });
        }
        const ok = await requirementReturn_model_1.default.update(id, patch);
        if (!ok) {
            return res.status(404).json({
                success: false,
                error: 'Devolución no encontrada o sin cambios',
            });
        }
        res.json({ success: true, message: 'Devolución actualizada exitosamente' });
    }
    catch (error) {
        console.error('Error actualizando devolución:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar devolución',
        });
    }
};
exports.updateReturn = updateReturn;
// Elimina una devolución (soft delete)
const deleteReturn = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const ok = await requirementReturn_model_1.default.delete(id);
        if (!ok) {
            return res.status(404).json({
                success: false,
                error: 'Devolución no encontrada',
            });
        }
        res.json({ success: true, message: 'Devolución eliminada exitosamente' });
    }
    catch (error) {
        console.error('Error eliminando devolución:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar devolución',
        });
    }
};
exports.deleteReturn = deleteReturn;
// Obtiene devoluciones por rango de fechas
const getReturnsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren parámetros startDate y endDate',
            });
        }
        const returns = await requirementReturn_model_1.default.listByDateRange(String(startDate), String(endDate));
        res.json({
            success: true,
            data: returns,
            message: `${returns.length} devoluciones encontradas en el rango de fechas`,
        });
    }
    catch (error) {
        console.error('Error obteniendo devoluciones por fecha:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener devoluciones por fecha',
        });
    }
};
exports.getReturnsByDateRange = getReturnsByDateRange;
// Obtiene estadísticas por PO
const getStatisticsByPO = async (req, res) => {
    try {
        const stats = await requirementReturn_model_1.default.getStatisticsByPO();
        res.json({
            success: true,
            data: stats,
            message: 'Estadísticas por PO obtenidas exitosamente',
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas por PO:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas por PO',
        });
    }
};
exports.getStatisticsByPO = getStatisticsByPO;
// Obtiene estadísticas por mes
const getStatisticsByMonth = async (req, res) => {
    try {
        const year = req.query.year ? Number(req.query.year) : undefined;
        const month = req.query.month ? Number(req.query.month) : undefined;
        const stats = await requirementReturn_model_1.default.getStatisticsByMonth(year, month);
        res.json({
            success: true,
            data: stats,
            message: 'Estadísticas por mes obtenidas exitosamente',
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas por mes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas por mes',
        });
    }
};
exports.getStatisticsByMonth = getStatisticsByMonth;
//# sourceMappingURL=requirementReturn.controller.js.map