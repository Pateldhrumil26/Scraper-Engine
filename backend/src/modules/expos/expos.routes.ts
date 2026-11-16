import { Router } from 'express';
import { ExposController } from './expos.controller';

const router = Router();

// Dashboard & Filter endpoints
router.get('/dashboard/stats', ExposController.getDashboardStats);
router.get('/filters', ExposController.getFilters);

// Bulk Operations
router.post('/bulk-delete', ExposController.bulkDelete);
router.post('/bulk-verify', ExposController.bulkVerify);

// CRUD Endpoints
router.get('/', ExposController.getExpos);
router.post('/', ExposController.create);
router.get('/:id', ExposController.getById);
router.put('/:id', ExposController.update);
router.delete('/:id', ExposController.delete);

// Status toggles
router.patch('/:id/favorite', ExposController.toggleFavorite);
router.patch('/:id/verify', ExposController.updateVerification);

export default router;
