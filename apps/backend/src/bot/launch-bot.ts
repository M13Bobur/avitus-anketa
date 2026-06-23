import { Telegraf } from 'telegraf';
import { logger } from '../config/logger';
import { logTelegramConnectionHint, withTelegramRetry } from './telegram-client';

export async function connectAndLaunchBot(bot: Telegraf, label: string): Promise<void> {
  const me = await withTelegramRetry(() => bot.telegram.getMe(), `${label}.getMe`);
  logger.info(`${label} connected: @${me.username}`);

  void bot.launch().then(
    () => logger.info(`${label} polling started`),
    (error) => {
      logger.error(`${label} polling failed`, error);
      logTelegramConnectionHint(error);
    },
  );
}
