import { Router } from 'express';
import {
  listReturns,
  getReturnById,
  createReturn,
  updateReturn,
  deleteReturn,
  getReturnsByDateRange,
  getStatisticsByPO,
  getStatisticsByMonth,
} from '../controllers/requirementReturn.controller';

const router = Router();

// CRUD básico
router.get('/', listReturns);
router.get('/statistics/by-po', getStatisticsByPO);
router.get('/statistics/by-month', getStatisticsByMonth);
router.get('/date-range', getReturnsByDateRange);
router.get('/:id', getReturnById);
router.post('/', createReturn);
router.put('/:id', updateReturn);
router.delete('/:id', deleteReturn);

export default router;
