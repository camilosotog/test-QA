import { Request, Response } from 'express';
import { io } from '../server';

// Almacenar el estado del canvas en memoria (en producción usar Redis)
let currentDrawingData: any[] = [];

export const getDrawingData = async (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      data: currentDrawingData, 
      message: 'Datos de dibujo obtenidos exitosamente' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const clearDrawing = async (req: Request, res: Response) => {
  try {
    currentDrawingData = [];
    
    // Emitir evento Socket.io para limpiar canvas en todos los clientes
    io.emit('drawing-cleared');
    
    res.json({ 
      success: true, 
      message: 'Canvas limpiado exitosamente' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const saveDrawingPoint = (drawingData: any) => {
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

export const getCurrentDrawingData = () => {
  return currentDrawingData;
};