
import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getOnlineUsers, getUsersByRole, getUsersByRoles } from '../controllers/users.controller';

const router = Router();
router.get('/online', getOnlineUsers);
router.get('/by-role', getUsersByRole);
router.get('/by-roles', getUsersByRoles); // 🚀 Nueva ruta optimizada

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
