import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { seedDefaultSources } from './config/seed';
import { schedulerService } from './services/scheduler.service';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Seed initial sources if needed
    await seedDefaultSources();

    // 3. Initialize background scheduler
    await schedulerService.init();

    // 4. Start Express Server
    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Business Expo Fetching Engine Server`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`📊 Mode: ${config.nodeEnv}`);
      console.log(`=======================================================`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${config.port} is already in use by another process.`);
        process.exit(1);
      } else {
        console.error('[Server Error]', err);
      }
    });

    // Graceful shutdown
    const cleanup = () => {
      schedulerService.stopAll();
      server.close(() => {
        console.log('[Server] Closed gracefully.');
        process.exit(0);
      });
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (error: any) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
