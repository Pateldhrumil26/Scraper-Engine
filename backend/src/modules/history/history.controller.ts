import { Request, Response } from 'express';
import { FetchLog } from '../../models/FetchLog';

export class HistoryController {
  /**
   * Get paginated fetch history logs
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 15));
      const skip = (page - 1) * limit;

      const { status, sourceId } = req.query;
      const query: any = {};

      if (status && status !== 'ALL') {
        query.status = status;
      }
      if (sourceId && sourceId !== 'ALL') {
        query.sourceId = sourceId;
      }

      const [total, logs] = await Promise.all([
        FetchLog.countDocuments(query),
        FetchLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ]);

      res.json({
        success: true,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data: logs,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get full details of a specific fetch log
   */
  static async getLogById(req: Request, res: Response): Promise<void> {
    try {
      const log = await FetchLog.findById(req.params.id);
      if (!log) {
        res.status(404).json({ success: false, message: 'Log not found' });
        return;
      }
      res.json({ success: true, data: log });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Clear old history logs
   */
  static async clearLogs(req: Request, res: Response): Promise<void> {
    try {
      await FetchLog.deleteMany({});
      res.json({ success: true, message: 'Fetch history cleared successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
