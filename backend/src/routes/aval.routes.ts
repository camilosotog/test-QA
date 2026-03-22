import { Router } from 'express';
import {
  listAvales,
  getAvalById,
  createAval,
  updateAval,
  deleteAval,
  publishToConfluence,
  testConfluence,
  mejorarObservaciones
} from '../controllers/aval.controller';

const router = Router();

router.get('/test-confluence', testConfluence);
router.post('/mejorar', mejorarObservaciones);
router.get('/', listAvales);
router.get('/:id', getAvalById);
router.post('/', createAval);
router.put('/:id', updateAval);
router.delete('/:id', deleteAval);
router.post('/:id/publish', publishToConfluence);

export default router;
