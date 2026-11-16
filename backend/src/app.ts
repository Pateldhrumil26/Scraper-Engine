import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sourcesRoutes from './modules/sources/sources.routes';
import exposRoutes from './modules/expos/expos.routes';
import historyRoutes from './modules/history/history.routes';
import exportRoutes from './modules/export/export.routes';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Business Expo Fetching Engine API',
    });
  });

  // Module Routes
  app.use('/api/sources', sourcesRoutes);
  app.use('/api/expos', exposRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/export', exportRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
};
