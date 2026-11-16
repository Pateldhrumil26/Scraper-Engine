import { Router } from 'express';
import { BackupController } from './backup.controller';

const router = Router();

router.get('/', BackupController.list);
router.post('/create', BackupController.create);
router.get('/download/:filename', BackupController.download);

export default router;
