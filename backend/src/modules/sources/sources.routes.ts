import { Router } from 'express';
import { SourcesController } from './sources.controller';

const router = Router();

router.get('/parsers', SourcesController.getParsers);
router.post('/test-preview', SourcesController.testUrlPreview);
router.post('/test-connection', SourcesController.testConnection);
router.post('/:id/test-connection', SourcesController.testConnection);
router.post('/fetch-all', SourcesController.triggerFetchAll);

router.get('/', SourcesController.getAll);
router.get('/:id', SourcesController.getById);
router.post('/', SourcesController.create);
router.put('/:id', SourcesController.update);
router.delete('/:id', SourcesController.delete);
router.patch('/:id/toggle', SourcesController.toggleActive);
router.post('/:id/fetch', SourcesController.triggerFetch);

export default router;
