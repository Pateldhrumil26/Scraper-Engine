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
    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Business Expo Fetching Engine Server`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`📊 Mode: ${config.nodeEnv}`);
      console.log(`=======================================================`);
    });
  } catch (error: any) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
