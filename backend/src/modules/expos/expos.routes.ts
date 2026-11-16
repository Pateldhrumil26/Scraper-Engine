import { Router } from 'express';
import { ExposController } from './expos.controller';

const router = Router();

router.get('/dashboard/stats', ExposController.getDashboardStats);
router.get('/filters', ExposController.getFilters);

router.get('/', ExposController.getExpos);
router.get('/:id', ExposController.getById);
router.delete('/:id', ExposController.delete);

export default router;
