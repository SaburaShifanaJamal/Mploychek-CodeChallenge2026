import { Router } from 'express';
import { create, list, remove, update } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Every route in this file needs a login AND the Admin role.
router.use(authenticate, requireAdmin);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;