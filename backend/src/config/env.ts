import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/business_expo_db',
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultUserAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
  rateLimitDelayMs: parseInt(process.env.RATE_LIMIT_DELAY_MS || '1500', 10),
  defaultCronSchedule: process.env.DEFAULT_CRON || '0 0 * * *', // Daily midnight
};
