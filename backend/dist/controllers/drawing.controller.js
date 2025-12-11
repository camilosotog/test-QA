"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentDrawingData = exports.saveDrawingPoint = exports.clearDrawing = exports.getDrawingData = void 0;
const server_1 = require("../server");
// Almacenar el estado del canvas en memoria (en producción usar Redis)
let currentDrawingData = [];
const getDrawingData = async (req, res) => {
    try {
        res.json({
            success: true,
            data: currentDrawingData,
            message: 'Datos de dibujo obtenidos exitosamente'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getDrawingData = getDrawingData;
const clearDrawing = async (req, res) => {
    try {
        currentDrawingData = [];
        // Emitir evento Socket.io para limpiar canvas en todos los clientes
        server_1.io.emit('drawing-cleared');
        res.json({
            success: true,
            message: 'Canvas limpiado exitosamente'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.clearDrawing = clearDrawing;
const saveDrawingPoint = (drawingData) => {
    // Guardar punto de dibujo en memoria
    currentDrawingData.push({
        ...drawingData,
        timestamp: new Date().toISOString()
    });
    // Limitar historial a últimos 10000 puntos para evitar memoria excesiva
    if (currentDrawingData.length > 10000) {
        currentDrawingData = currentDrawingData.slice(-10000);
    }
};
exports.saveDrawingPoint = saveDrawingPoint;
const getCurrentDrawingData = () => {
    return currentDrawingData;
};
exports.getCurrentDrawingData = getCurrentDrawingData;
//# sourceMappingURL=drawing.controller.js.map