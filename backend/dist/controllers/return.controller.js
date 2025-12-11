"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatisticsByMonth = exports.getStatisticsByPO = exports.getReturnsByDateRange = exports.deleteReturn = exports.updateReturn = exports.createReturn = exports.getReturnById = exports.listReturns = void 0;
const return_model_1 = require("../models/return.model");
const listReturns = async (req, res) => {
    try {
        const { po_name, task_code, limit = 1000 } = req.query;
        const filters = {};
        if (po_name)
            filters.po_name = po_name;
        if (task_code)
            filters.task_code = task_code;
        const returns = await return_model_1.ReturnModel.list(filters, Number(limit));
        res.json({ success: true, data: returns, message: "Returns retrieved successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.listReturns = listReturns;
const getReturnById = async (req, res) => {
    try {
        const { id } = req.params;
        const returnData = await return_model_1.ReturnModel.getById(Number(id));
        if (!returnData) {
            res.status(404).json({ success: false, error: "Return not found" });
            return;
        }
        res.json({ success: true, data: returnData, message: "Return retrieved successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getReturnById = getReturnById;
const createReturn = async (req, res) => {
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
        const returnData = {
            po_name,
            task_code,
            return_reason
        };
        const id = await return_model_1.ReturnModel.create(returnData);
        res.status(201).json({
            success: true,
            id,
            data: { ...returnData, id },
            message: "Return created successfully"
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createReturn = createReturn;
const updateReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const patch = req.body;
        const success = await return_model_1.ReturnModel.update(Number(id), patch);
        if (!success) {
            res.status(404).json({ success: false, error: "Return not found or update failed" });
            return;
        }
        res.json({ success: true, message: "Return updated successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateReturn = updateReturn;
const deleteReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await return_model_1.ReturnModel.delete(Number(id));
        if (!success) {
            res.status(404).json({ success: false, error: "Return not found" });
            return;
        }
        res.json({ success: true, message: "Return deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.deleteReturn = deleteReturn;
const getReturnsByDateRange = async (req, res) => {
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
        const returns = await return_model_1.ReturnModel.listByDateRange(start_date, end_date);
        res.json({ success: true, data: returns, message: "Returns retrieved by date range" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getReturnsByDateRange = getReturnsByDateRange;
const getStatisticsByPO = async (req, res) => {
    try {
        const statistics = await return_model_1.ReturnModel.getStatisticsByPO();
        res.json({ success: true, data: statistics, message: "Statistics by PO retrieved" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getStatisticsByPO = getStatisticsByPO;
const getStatisticsByMonth = async (req, res) => {
    try {
        const { year, month } = req.query;
        const statistics = await return_model_1.ReturnModel.getStatisticsByMonth(year ? Number(year) : undefined, month ? Number(month) : undefined);
        res.json({ success: true, data: statistics, message: "Statistics by month retrieved" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getStatisticsByMonth = getStatisticsByMonth;
//# sourceMappingURL=return.controller.js.map