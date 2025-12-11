import { Request, Response } from 'express';
import RequirementReturnModel, { RequirementReturn } from '../models/requirementReturn.model';

// Lista todas las devoluciones con filtros opcionales
export const listReturns = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query.po_name) filters.po_name = String(req.query.po_name);
    if (req.query.task_code) filters.task_code = String(req.query.task_code);

    const limit = req.query.limit ? Number(req.query.limit) : 1000;
    const returns = await RequirementReturnModel.list(filters, limit);

    res.json({ success: true, data: returns, message: 'Devoluciones listadas exitosamente' });
  } catch (error) {
    console.error('Error listando devoluciones:', error);
    res.status(500).json({ success: false, error: 'Error al listar devoluciones' });
  }
};

// Obtiene una devolución por ID
export const getReturnById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const requirementReturn = await RequirementReturnModel.getById(id);

    if (!requirementReturn) {
      return res.status(404).json({ success: false, error: 'Devolución no encontrada' });
    }

    res.json({ success: true, data: requirementReturn });
  } catch (error) {
    console.error('Error obteniendo devolución:', error);
    res.status(500).json({ success: false, error: 'Error al obtener devolución' });
  }
};

// Crea una nueva devolución
export const createReturn = async (req: Request, res: Response) => {
  try {
    const { po_name, task_code, return_reason } = req.body;

    // Validación de campos requeridos
    if (!po_name || !task_code || !return_reason) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: po_name, task_code, return_reason',
      });
    }

    const payload: RequirementReturn = {
      po_name,
      task_code,
      return_reason,
    };

    const id = await RequirementReturnModel.create(payload);

    res.status(201).json({
      success: true,
      id,
      message: 'Devolución registrada exitosamente',
    });
  } catch (error) {
    console.error('Error creando devolución:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear devolución',
      details: message,
    });
  }
};

// Actualiza una devolución existente
export const updateReturn = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const patch = req.body;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar',
      });
    }

    const ok = await RequirementReturnModel.update(id, patch);

    if (!ok) {
      return res.status(404).json({
        success: false,
        error: 'Devolución no encontrada o sin cambios',
      });
    }

    res.json({ success: true, message: 'Devolución actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando devolución:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar devolución',
    });
  }
};

// Elimina una devolución (soft delete)
export const deleteReturn = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ok = await RequirementReturnModel.delete(id);

    if (!ok) {
      return res.status(404).json({
        success: false,
        error: 'Devolución no encontrada',
      });
    }

    res.json({ success: true, message: 'Devolución eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando devolución:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar devolución',
    });
  }
};

// Obtiene devoluciones por rango de fechas
export const getReturnsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren parámetros startDate y endDate',
      });
    }

    const returns = await RequirementReturnModel.listByDateRange(
      String(startDate),
      String(endDate)
    );

    res.json({
      success: true,
      data: returns,
      message: `${returns.length} devoluciones encontradas en el rango de fechas`,
    });
  } catch (error) {
    console.error('Error obteniendo devoluciones por fecha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener devoluciones por fecha',
    });
  }
};

// Obtiene estadísticas por PO
export const getStatisticsByPO = async (req: Request, res: Response) => {
  try {
    const stats = await RequirementReturnModel.getStatisticsByPO();

    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas por PO obtenidas exitosamente',
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas por PO:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas por PO',
    });
  }
};

// Obtiene estadísticas por mes
export const getStatisticsByMonth = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;

    const stats = await RequirementReturnModel.getStatisticsByMonth(year, month);

    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas por mes obtenidas exitosamente',
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas por mes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas por mes',
    });
  }
};
