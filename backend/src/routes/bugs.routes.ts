import { Router } from 'express';
import { listBugs, getBugById, createBug, updateBug, deleteBug } from '../controllers/bugs.controller';

const router = Router();

router.get('/', listBugs);
router.get('/:id', getBugById);
router.post('/', createBug);
router.put('/:id', updateBug);
router.delete('/:id', deleteBug);

export default router;
