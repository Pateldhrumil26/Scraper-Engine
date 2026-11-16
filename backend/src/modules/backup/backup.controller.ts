import { Request, Response } from 'express';
import { BackupService } from './backup.service';

export class BackupController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const backup = await BackupService.createBackup();
      res.status(201).json({
        success: true,
        message: `Backup created successfully (${backup.totalExpos} expos, ${backup.totalSources} sources).`,
        data: backup,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const backups = BackupService.listBackups();
      res.json({ success: true, count: backups.length, data: backups });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async download(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const filePath = BackupService.getBackupFilePath(filename);
      if (!filePath) {
        res.status(404).json({ success: false, message: 'Backup file not found.' });
        return;
      }
      res.download(filePath, filename);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
