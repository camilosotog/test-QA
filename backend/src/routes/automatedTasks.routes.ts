import { Router } from 'express';
import { getAutomatedTasks, createAutomatedTask, updateAutomatedTask, deleteAutomatedTask } from '../controllers/automatedTasks.controller';

const router = Router();

router.get('/', getAutomatedTasks);
router.post('/', createAutomatedTask);
router.put('/:id', updateAutomatedTask);
router.delete('/:id', deleteAutomatedTask);

export default router;
