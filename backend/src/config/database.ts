import mongoose from 'mongoose';
import { config } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri);
    console.log(`[Database] MongoDB connected successfully to ${config.mongoUri}`);
  } catch (error: any) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] MongoDB runtime error: ${err.message}`);
  });
};
