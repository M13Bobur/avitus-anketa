import fs from 'fs';
import path from 'path';
import { Context, Telegraf } from 'telegraf';
import { InlineKeyboardMarkup, Message, Update } from 'telegraf/types';
import { config } from '../config';
import { logger } from '../config/logger';
import { authService } from '../application/services/auth.service';
import { applicationService } from '../application/services/survey.service';
import { UnauthorizedError } from '../domain/errors/app.error';
import { ApplicationStatus } from '@avitus/shared-types';
import {
  getTelegrafOptions,
  logTelegramConnectionHint,
  withOperationTimeout,
} from '../bot/telegram-client';
import { connectAndLaunchBot } from '../bot/launch-bot';
import {
  WELCOME_AUTH_MESSAGE,
  AUTH_SUCCESS_MESSAGE,
  AUTH_FAILED_MESSAGE,
  UNAUTHORIZED_MESSAGE,
  EMPTY_LIST_MESSAGE,
  LOADING_MESSAGE,
  mainMenuKeyboard,
  listHeader,
  applicationListKeyboard,
  applicationDetailKeyboard,
  parseListCallback,
  parseAppCallback,
} from './messages';
import {
  formatApplicationListItem,
  formatApplicationDetail,
  formatPhotoCaption,
  splitMessage,
} from './format-application';
import { resolveUploadFile } from './resolve-upload';

type AdminBotContext = Context<Update>;

const PAGE_SIZE = 8;
const TELEGRAM_OP_TIMEOUT_MS = 15_000;
const pendingAuth = new Set<number>();

type MessageExtra = {
  parse_mode?: 'HTML';
  reply_markup?: InlineKeyboardMarkup;
};

function getCallbackMessage(ctx: AdminBotContext): Message | undefined {
  const msg = ctx.callbackQuery?.message;
  if (!msg || !('chat' in msg)) return undefined;
  return msg as Message;
}

async function answerCallback(ctx: AdminBotContext): Promise<void> {
  try {
    await withOperationTimeout(
      () => ctx.answerCbQuery(),
      5_000,
      'answerCbQuery',
    );
  } catch (error) {
    logger.debug('answerCbQuery skipped', error instanceof Error ? error.message : error);
  }
}

async function sendMessage(
  ctx: AdminBotContext,
  text: string,
  extra?: MessageExtra,
) {
  await withOperationTimeout(
    () => ctx.reply(text, extra),
    TELEGRAM_OP_TIMEOUT_MS,
    'sendMessage',
  );
}

async function updateCallbackMessage(
  ctx: AdminBotContext,
  text: string,
  extra?: MessageExtra,
) {
  const message = getCallbackMessage(ctx);

  if (message && 'text' in message) {
    try {
      await withOperationTimeout(
        () => ctx.telegram.editMessageText(
          message.chat.id,
          message.message_id,
          undefined,
          text,
          extra,
        ),
        TELEGRAM_OP_TIMEOUT_MS,
        'editMessageText',
      );
      return;
    } catch (error) {
      logger.debug(
        'editMessageText failed, sending new message',
        error instanceof Error ? error.message : error,
      );
    }
  }

  if (message) {
    try {
      await withOperationTimeout(
        () => ctx.telegram.deleteMessage(message.chat.id, message.message_id),
        TELEGRAM_OP_TIMEOUT_MS,
        'deleteMessage',
      );
    } catch {
      // ignore
    }
  }

  await sendMessage(ctx, text, extra);
}

async function deleteCallbackMessage(ctx: AdminBotContext): Promise<void> {
  const message = getCallbackMessage(ctx);
  if (!message) return;

  try {
    await withOperationTimeout(
      () => ctx.telegram.deleteMessage(message.chat.id, message.message_id),
      TELEGRAM_OP_TIMEOUT_MS,
      'deleteMessage',
    );
  } catch {
    // ignore
  }
}

async function sendPhotoAttachment(
  ctx: AdminBotContext,
  photoPath: string,
  caption: string,
): Promise<boolean> {
  try {
    const buffer = fs.readFileSync(photoPath);
    await withOperationTimeout(
      () => ctx.replyWithPhoto(
        { source: buffer, filename: path.basename(photoPath) },
        { caption },
      ),
      TELEGRAM_OP_TIMEOUT_MS,
      'sendPhoto',
    );
    return true;
  } catch (error) {
    logger.warn('sendPhoto failed', error instanceof Error ? error.message : error);
    return false;
  }
}

async function sendDocumentAttachment(
  ctx: AdminBotContext,
  filePath: string,
  caption: string,
  filename: string,
  extra?: MessageExtra,
): Promise<boolean> {
  try {
    const buffer = fs.readFileSync(filePath);
    await withOperationTimeout(
      () => ctx.replyWithDocument(
        { source: buffer, filename },
        { caption, ...extra },
      ),
      TELEGRAM_OP_TIMEOUT_MS,
      'sendDocument',
    );
    return true;
  } catch (error) {
    logger.warn('sendDocument failed', error instanceof Error ? error.message : error);
    return false;
  }
}

async function getAuthenticatedAdmin(telegramId: number) {
  return authService.getAdminByTelegramId(telegramId);
}

async function showMainMenu(
  ctx: AdminBotContext,
  username: string,
  fromCallback = false,
) {
  const text = `${AUTH_SUCCESS_MESSAGE}\n\n👤 <b>${username}</b>`;
  const extra: MessageExtra = { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() };

  if (fromCallback) {
    await updateCallbackMessage(ctx, text, extra);
  } else {
    await sendMessage(ctx, text, extra);
  }
}

async function showApplicationList(
  ctx: AdminBotContext,
  filter: 'new' | 'all',
  page: number,
) {
  await updateCallbackMessage(ctx, LOADING_MESSAGE);

  const { data, total, totalPages } = await applicationService.getApplications({
    status: filter === 'new' ? ApplicationStatus.NEW : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const completed = data.filter((app) => app.completed);

  if (!completed.length) {
    await updateCallbackMessage(ctx, EMPTY_LIST_MESSAGE, {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const items = completed.map((app) => ({
    id: app._id,
    label: formatApplicationListItem(app),
  }));

  const text = listHeader(filter, total, page, totalPages);
  const extra: MessageExtra = {
    parse_mode: 'HTML',
    reply_markup: applicationListKeyboard(items, filter, page, totalPages),
  };

  await updateCallbackMessage(ctx, text, extra);
}

function stripAttachmentLines(text: string): string {
  return text
    .replace(/\n🖼 <b>Foto:<\/b>[^\n]*/g, '')
    .replace(/\n📎 <b>Rezyume:<\/b>[^\n]*/g, '');
}

function buildResumeFilename(app: { answers: { fullName?: string } }, filePath: string): string {
  const name = (app.answers.fullName ?? 'Nomzod')
    .replace(/[^\w\s\u0400-\u04FF-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const ext = path.extname(filePath) || '.pdf';
  return `Rezyume_${name}${ext}`;
}

async function showApplicationDetail(
  ctx: AdminBotContext,
  appId: string,
  filter: 'new' | 'all',
  page: number,
) {
  await updateCallbackMessage(ctx, LOADING_MESSAGE);

  const app = await applicationService.getApplicationById(appId);
  const keyboard = applicationDetailKeyboard(filter, page);
  const detailText = stripAttachmentLines(formatApplicationDetail(app));
  const photoPath = app.photoFile ? resolveUploadFile(app.photoFile) : null;
  const resumePath = app.resumeFile ? resolveUploadFile(app.resumeFile) : null;

  await deleteCallbackMessage(ctx);

  if (photoPath) {
    const sent = await sendPhotoAttachment(ctx, photoPath, formatPhotoCaption(app));
    if (!sent) {
      await sendMessage(ctx, '🖼 Fotosurat yuklanmadi. Quyida ariza ma\'lumotlari.', {
        parse_mode: 'HTML',
      });
    }
  }

  const chunks = splitMessage(detailText);
  for (let i = 0; i < chunks.length; i++) {
    const isLastWithoutResume = i === chunks.length - 1 && !resumePath;
    await sendMessage(ctx, chunks[i], {
      parse_mode: 'HTML',
      ...(isLastWithoutResume ? { reply_markup: keyboard } : {}),
    });
  }

  if (resumePath) {
    const filename = buildResumeFilename(app, resumePath);
    const sent = await sendDocumentAttachment(
      ctx,
      resumePath,
      '📎 Rezyume — yuklab olish uchun faylni bosing',
      filename,
      { reply_markup: keyboard },
    );
    if (!sent) {
      await sendMessage(ctx, '📎 Rezyume mavjud, lekin yuborib bo\'lmadi.', {
        reply_markup: keyboard,
      });
    }
  } else if (!chunks.length) {
    await sendMessage(ctx, 'Ma\'lumot topilmadi.', { reply_markup: keyboard });
  }
}

async function handleCallback(ctx: AdminBotContext, data: string, telegramId: number) {
  const admin = await getAuthenticatedAdmin(telegramId);
  if (!admin) {
    await sendMessage(ctx, UNAUTHORIZED_MESSAGE);
    return;
  }

  if (data === 'm') {
    await showMainMenu(ctx, admin.username, true);
    return;
  }

  const listParams = parseListCallback(data);
  if (listParams) {
    await showApplicationList(ctx, listParams.filter, listParams.page);
    return;
  }

  const appParams = parseAppCallback(data);
  if (appParams) {
    await showApplicationDetail(ctx, appParams.appId, appParams.filter, appParams.page);
  }
}

export function setupAdminBot(bot: Telegraf<AdminBotContext>) {
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from!.id;
    pendingAuth.delete(telegramId);

    const admin = await getAuthenticatedAdmin(telegramId);
    if (admin) {
      await showMainMenu(ctx, admin.username);
      return;
    }

    pendingAuth.add(telegramId);
    await sendMessage(ctx, WELCOME_AUTH_MESSAGE, { parse_mode: 'HTML' });
  });

  bot.command('menu', async (ctx) => {
    const admin = await getAuthenticatedAdmin(ctx.from!.id);
    if (!admin) {
      await sendMessage(ctx, UNAUTHORIZED_MESSAGE);
      return;
    }
    await showMainMenu(ctx, admin.username);
  });

  bot.on('callback_query', async (ctx) => {
    await answerCallback(ctx);

    if (!('data' in ctx.callbackQuery) || !ctx.callbackQuery.data) return;

    const data = ctx.callbackQuery.data;
    const telegramId = ctx.from!.id;

    void handleCallback(ctx, data, telegramId).catch(async (error) => {
      logger.error('Admin bot callback error', error);
      try {
        await sendMessage(ctx, '❌ Xatolik yuz berdi. /menu buyrug\'ini yuboring.');
      } catch {
        // ignore
      }
    });
  });

  bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;

    const telegramId = ctx.from!.id;

    const admin = await getAuthenticatedAdmin(telegramId);
    if (admin) {
      await showMainMenu(ctx, admin.username);
      return;
    }

    if (!pendingAuth.has(telegramId)) {
      await sendMessage(ctx, UNAUTHORIZED_MESSAGE);
      return;
    }

    try {
      const authenticated = await authService.authenticateTelegram(
        ctx.message.text.trim(),
        telegramId,
      );
      pendingAuth.delete(telegramId);
      await showMainMenu(ctx, authenticated.username);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        await sendMessage(ctx, AUTH_FAILED_MESSAGE, { parse_mode: 'HTML' });
      } else {
        logger.error('Admin bot auth error', error);
        await sendMessage(ctx, 'Xatolik yuz berdi. Qayta urinib ko\'ring.');
      }
    }
  });
}

export function createAdminBot(): Telegraf<AdminBotContext> | null {
  if (!config.telegram.adminBotToken) {
    logger.warn('TELEGRAM_ADMIN_BOT_TOKEN not set, admin bot will not start');
    return null;
  }

  const bot = new Telegraf<AdminBotContext>(
    config.telegram.adminBotToken,
    getTelegrafOptions(180_000),
  );
  setupAdminBot(bot);
  return bot;
}

export async function startAdminBot(bot: Telegraf<AdminBotContext>) {
  bot.catch(async (err, ctx) => {
    logger.error('Unhandled admin bot error', err);
    try {
      await sendMessage(ctx, 'Vaqtinchalik xatolik. Birozdan keyin qayta urinib ko\'ring.');
    } catch {
      // ignore
    }
  });

  try {
    await connectAndLaunchBot(bot, 'Admin bot');
  } catch (error) {
    logTelegramConnectionHint(error);
    throw error;
  }
}
