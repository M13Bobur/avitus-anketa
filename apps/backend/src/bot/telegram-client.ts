import type { Agent } from 'http';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config } from '../config';
import { logger } from '../config/logger';

const TELEGRAM_REQUEST_TIMEOUT_MS = 20_000;

export function createTelegramAgent(): Agent | undefined {
  const proxy = config.telegram.proxy;
  if (!proxy) {
    return new https.Agent({
      keepAlive: true,
      timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
    });
  }

  logger.info(`Telegram proxy enabled: ${proxy.replace(/:[^:@/]+@/, ':***@')}`);
  return new HttpsProxyAgent(proxy, {
    timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
  }) as unknown as Agent;
}

export function getTelegrafOptions(handlerTimeout = 90_000) {
  const agent = createTelegramAgent();
  return {
    handlerTimeout,
    telegram: {
      ...(agent ? { agent, attachmentAgent: agent } : {}),
      ...(config.telegram.apiRoot ? { apiRoot: config.telegram.apiRoot } : {}),
    },
  };
}

export async function withOperationTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
