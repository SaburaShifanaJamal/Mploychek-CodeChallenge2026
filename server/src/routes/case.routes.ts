import { Router } from 'express';
import { create, list, update } from '../controllers/case.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, requireAdmin, create);
router.put('/:id', authenticate, requireAdmin, update);

export default router;