import type { Agent } from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config } from '../config';
import { logger } from '../config/logger';

export function createTelegramAgent(): Agent | undefined {
  const proxy = config.telegram.proxy;
  if (!proxy) return undefined;

  logger.info(`Telegram proxy enabled: ${proxy.replace(/:[^:@/]+@/, ':***@')}`);
  return new HttpsProxyAgent(proxy) as unknown as Agent;
}

export function getTelegrafOptions() {
  const agent = createTelegramAgent();
  const options: {
    telegram?: {
      agent?: Agent;
      apiRoot?: string;
    };
  } = {};

  if (agent) {
    options.telegram = { agent };
  }

  if (config.telegram.apiRoot) {
    options.telegram = {
      ...options.telegram,
      apiRoot: config.telegram.apiRoot,
    };
  }

  return options;
}

function isRetryableTelegramError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const retryableCodes = ['econnreset', 'etimedout', 'econnrefused', 'socket hang up', 'network'];
  return retryableCodes.some((code) => message.includes(code));
}

export async function withTelegramRetry<T>(
  operation: () => Promise<T>,
  label = 'telegram request',
): Promise<T> {
  const maxAttempts = config.telegram.retryAttempts;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableTelegramError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = attempt * 1000;
      logger.warn(
        `${label} failed (attempt ${attempt}/${maxAttempts}), retry in ${delayMs}ms`,
        error instanceof Error ? error.message : error,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export function logTelegramConnectionHint(error: unknown): void {
  logger.error(
    'Telegram API ga ulanib bo\'lmadi. TELEGRAM_PROXY sozlang (masalan: http://127.0.0.1:7890) yoki VPN yoqing.',
    error,
  );
}
