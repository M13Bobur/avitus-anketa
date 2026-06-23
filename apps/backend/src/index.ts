import fs from 'fs';
import path from 'path';
import { config, isProduction } from './config';
import { logger } from './config/logger';
import { connectDatabase } from './infrastructure/database/connection';
import { migrateApplicationStatuses } from './infrastructure/database/migrate-status';
import { createApp } from './app';
import { createBot, startBot } from './bot';
import { createAdminBot, startAdminBot } from './admin-bot';
import type { Telegraf } from 'telegraf';
import { authService } from './application/services/auth.service';
import { assertProductionSecurity } from './domain/security';

async function bootstrap() {
  assertProductionSecurity();
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
    if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
      logger.info(`Swagger docs: http://${config.host}:${config.port}/api/docs`);
    }
  });

  const runningBots: Telegraf[] = [];

  const surveyBot = createBot();
  const adminBot = createAdminBot();
  if (surveyBot) runningBots.push(surveyBot);
  if (adminBot) runningBots.push(adminBot);

  await Promise.all([
    surveyBot ? startBot(surveyBot) : Promise.resolve(),
    adminBot ? startAdminBot(adminBot) : Promise.resolve(),
  ]);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    await Promise.allSettled(runningBots.map((bot) => bot.stop(signal)));
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
