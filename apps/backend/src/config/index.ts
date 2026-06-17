import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function loadEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
  }
  dotenv.config();
}

loadEnv();

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  mongodbUri: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/avitus-anketa'),
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    proxy: process.env.TELEGRAM_PROXY ?? process.env.HTTPS_PROXY ?? '',
    apiRoot: process.env.TELEGRAM_API_ROOT ?? '',
    retryAttempts: parseInt(process.env.TELEGRAM_RETRY_ATTEMPTS ?? '3', 10),
  },
  adminDistPath: process.env.ADMIN_DIST_PATH
    ? path.isAbsolute(process.env.ADMIN_DIST_PATH)
      ? process.env.ADMIN_DIST_PATH
      : path.resolve(process.cwd(), process.env.ADMIN_DIST_PATH)
    : path.resolve(__dirname, '../../../admin/dist'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },
  upload: {
    dir: process.env.UPLOAD_DIR && path.isAbsolute(process.env.UPLOAD_DIR)
      ? process.env.UPLOAD_DIR
      : path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'apps/backend/uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10),
  },
  seed: {
    adminUsername: process.env.SEED_ADMIN_USERNAME ?? 'admin',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
  },
} as const;

export const isProduction = config.nodeEnv === 'production';
