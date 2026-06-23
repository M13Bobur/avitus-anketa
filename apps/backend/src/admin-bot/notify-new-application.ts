import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { applicationService } from '../application/services/survey.service';
import { adminRepository } from '../infrastructure/repositories/admin.repository';
import { logger } from '../config/logger';
import { withOperationTimeout, withTelegramRetry } from '../bot/telegram-client';
import { escapeHtml } from './format-application';
import { newApplicationNotification, newApplicationKeyboard } from './messages';

type AdminBot = Telegraf<Context<Update>>;

const TELEGRAM_OP_TIMEOUT_MS = 15_000;

let adminBot: AdminBot | null = null;

export function initAdminBotNotifier(bot: AdminBot): void {
  adminBot = bot;
}

function formatSubmittedAt(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function notifyAdminsNewApplication(applicationId: string): Promise<void> {
  if (!adminBot) {
    logger.debug('Admin bot not initialized, skipping new application notification');
    return;
  }

  try {
    const app = await applicationService.getApplicationById(applicationId);
    const admins = await adminRepository.findAllWithTelegramId();

    if (!admins.length) {
      logger.debug('No admins with linked Telegram ID for new application notification');
      return;
    }

    const fullName = escapeHtml(app.answers.fullName ?? 'Noma\'lum');
    const position = escapeHtml(
      app.answers.position ?? app.answers.otherPosition ?? '—',
    );
    const text = newApplicationNotification(
      fullName,
      position,
      formatSubmittedAt(app.submittedAt ?? app.createdAt),
    );
    const keyboard = newApplicationKeyboard(app._id);

    await Promise.allSettled(
      admins.map(async (admin) => {
        if (!admin.telegramId) return;

        await withTelegramRetry(
          () => withOperationTimeout(
            () => adminBot!.telegram.sendMessage(admin.telegramId!, text, {
              parse_mode: 'HTML',
              reply_markup: keyboard,
            }),
            TELEGRAM_OP_TIMEOUT_MS,
            'notifyNewApplication',
          ),
          'notifyNewApplication',
        );
      }),
    );
  } catch (error) {
    logger.error('Failed to notify admins about new application', error);
  }
}
