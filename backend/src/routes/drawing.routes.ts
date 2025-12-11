import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { 
  getDrawingData,
  clearDrawing
} from '../controllers/drawing.controller';

const router = Router();

// Obtener datos actuales del dibujo
router.get('/data', auth, getDrawingData);

// Limpiar canvas (solo usuarios autenticados)
router.post('/clear', auth, clearDrawing);

export default router;