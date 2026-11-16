import { Router } from 'express';
import { ExportController } from './export.controller';

const router = Router();

router.get('/excel', ExportController.exportExcel);
router.get('/csv', ExportController.exportCsv);

export default router;
