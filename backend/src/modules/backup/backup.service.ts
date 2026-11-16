import fs from 'fs';
import path from 'path';
import { Expo } from '../../models/Expo';
import { WebsiteSource } from '../../models/WebsiteSource';
import { FetchLog } from '../../models/FetchLog';

const BACKUP_DIR = path.resolve(__dirname, '../../../backups');

export interface BackupMetadata {
  filename: string;
  createdAt: Date;
  sizeBytes: number;
  totalExpos: number;
  totalSources: number;
  totalLogs: number;
}

export class BackupService {
  private static ensureBackupDir(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Creates a full JSON snapshot of MongoDB collections
   */
  static async createBackup(): Promise<BackupMetadata> {
    this.ensureBackupDir();

    const [expos, sources, logs] = await Promise.all([
      Expo.find().lean(),
      WebsiteSource.find().lean(),
      FetchLog.find().lean(),
    ]);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-business-expo-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    const payload = {
      backupDate: new Date().toISOString(),
      version: '1.0',
      database: 'business_expo_db',
      counts: {
        expos: expos.length,
        sources: sources.length,
        logs: logs.length,
      },
      data: {
        expos,
        sources,
        logs,
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    const stats = fs.statSync(filePath);

    return {
      filename,
      createdAt: new Date(),
      sizeBytes: stats.size,
      totalExpos: expos.length,
      totalSources: sources.length,
      totalLogs: logs.length,
    };
  }

  /**
   * Lists all existing backup snapshots
   */
  static listBackups(): BackupMetadata[] {
    this.ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json'));

    const list: BackupMetadata[] = [];
    for (const f of files) {
      const filePath = path.join(BACKUP_DIR, f);
      try {
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        list.push({
          filename: f,
          createdAt: stats.birthtime || stats.mtime,
          sizeBytes: stats.size,
          totalExpos: content.counts?.expos || 0,
          totalSources: content.counts?.sources || 0,
          totalLogs: content.counts?.logs || 0,
        });
      } catch {
        // Skip unreadable files
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Returns path to a specific backup file
   */
  static getBackupFilePath(filename: string): string | null {
    this.ensureBackupDir();
    const safeName = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeName);
    return fs.existsSync(filePath) ? filePath : null;
  }
}
