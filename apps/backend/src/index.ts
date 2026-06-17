import fs from 'fs';
import path from 'path';
import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase } from './infrastructure/database/connection';
import { migrateApplicationStatuses } from './infrastructure/database/migrate-status';
import { createApp } from './app';
import { createBot, startBot } from './bot';
import { authService } from './application/services/auth.service';

async function bootstrap() {
  const logsDir = path.resolve(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const uploadsDir = config.upload.dir;
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await connectDatabase();
  await migrateApplicationStatuses();

  await authService.seedDefaultAdmin(
    config.seed.adminUsername,
    config.seed.adminPassword,
  );
  logger.info('Default admin seeded (if not exists)');

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    logger.info(`Server running on http://${config.host}:${config.port}`);
    logger.info(`Swagger docs: http://${config.host}:${config.port}/api/docs`);
  });

  const bot = createBot();
  if (bot) {
    await startBot(bot);
  }

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});
