import { Request, Response } from "express";
import { Return, ReturnModel } from "../models/return.model";

export const listReturns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { po_name, task_code, limit = 1000 } = req.query;
    const filters: { po_name?: string; task_code?: string } = {};
    
    if (po_name) filters.po_name = po_name as string;
    if (task_code) filters.task_code = task_code as string;

    const returns = await ReturnModel.list(filters, Number(limit));
    res.json({ success: true, data: returns, message: "Returns retrieved successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReturnById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const returnData = await ReturnModel.getById(Number(id));

    if (!returnData) {
      res.status(404).json({ success: false, error: "Return not found" });
      return;
    }

    res.json({ success: true, data: returnData, message: "Return retrieved successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { po_name, task_code, return_reason } = req.body;

    if (!po_name || !task_code || !return_reason) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
        details: "po_name, task_code, and return_reason are required"
      });
      return;
    }

    const returnData: Return = {
      po_name,
      task_code,
      return_reason
    };

    const id = await ReturnModel.create(returnData);
    res.status(201).json({
      success: true,
      id,
      data: { ...returnData, id },
      message: "Return created successfully"
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patch = req.body;

    const success = await ReturnModel.update(Number(id), patch);

    if (!success) {
      res.status(404).json({ success: false, error: "Return not found or update failed" });
      return;
    }

    res.json({ success: true, message: "Return updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await ReturnModel.delete(Number(id));

    if (!success) {
      res.status(404).json({ success: false, error: "Return not found" });
      return;
    }

    res.json({ success: true, message: "Return deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReturnsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({
        success: false,
        error: "Missing required parameters",
        details: "start_date and end_date are required"
      });
      return;
    }

    const returns = await ReturnModel.listByDateRange(
      start_date as string,
      end_date as string
    );

    res.json({ success: true, data: returns, message: "Returns retrieved by date range" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStatisticsByPO = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await ReturnModel.getStatisticsByPO();
    res.json({ success: true, data: statistics, message: "Statistics by PO retrieved" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStatisticsByMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query;
    const statistics = await ReturnModel.getStatisticsByMonth(
      year ? Number(year) : undefined,
      month ? Number(month) : undefined
    );

    res.json({ success: true, data: statistics, message: "Statistics by month retrieved" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
