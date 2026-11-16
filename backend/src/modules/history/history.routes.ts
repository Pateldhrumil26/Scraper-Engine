import { Router } from 'express';
import { HistoryController } from './history.controller';

const router = Router();

router.get('/', HistoryController.getLogs);
router.get('/:id', HistoryController.getLogById);
router.delete('/', HistoryController.clearLogs);

export default router;
