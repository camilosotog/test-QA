import { Router } from 'express';
import { listBugs, listBugsByMonth, listMonthsSummary, listBugsBySpecificMonth, getBugById, createBug, updateBug, deleteBug } from '../controllers/bugs.controller';

const router = Router();

router.get('/months-summary', listMonthsSummary);
router.get('/by-month/:monthKey', listBugsBySpecificMonth);
router.get('/by-month', listBugsByMonth);
router.get('/', listBugs);
router.get('/:id', getBugById);
router.post('/', createBug);
router.put('/:id', updateBug);
router.delete('/:id', deleteBug);

export default router;
