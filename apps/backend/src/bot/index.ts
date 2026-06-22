import { Context, Telegraf } from 'telegraf';
import { Update, Message } from 'telegraf/types';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../config/logger';
import { surveyService } from '../application/services/survey.service';
import { ValidationError } from '../domain/errors/app.error';
import { SurveyStep, UserStatus } from '@avitus/shared-types';
import {
  WELCOME_MESSAGE,
  CANCEL_MESSAGE,
  RESTART_MESSAGE,
  COMPLETED_MESSAGE,
  REJECTED_MESSAGE,
  STEP_MESSAGES,
  getStepKeyboard,
  isTextStep,
  isEnumStep,
} from './messages';
import { userRepository } from '../infrastructure/repositories/user.repository';
import {
  getTelegrafOptions,
  withTelegramRetry,
  logTelegramConnectionHint,
} from './telegram-client';

type BotContext = Context<Update>;

const ALLOWED_RESUME_EXT = new Set(['.pdf', '.doc', '.docx']);
const ALLOWED_PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function validateUploadSize(bytes: number) {
  const maxBytes = config.upload.maxFileSizeMb * 1024 * 1024;
  if (bytes > maxBytes) {
    throw new ValidationError(
      `Fayl hajmi ${config.upload.maxFileSizeMb} MB dan oshmasligi kerak`,
    );
  }
}

function normalizeExtension(ext: string, allowed: Set<string>): string {
  const lower = ext.toLowerCase();
  if (!allowed.has(lower)) {
    throw new ValidationError('Ruxsat etilmagan fayl turi');
  }
  return lower;
}

async function safeReply(
  ctx: BotContext,
  text: string,
  extra?: Parameters<BotContext['reply']>[1],
) {
  await withTelegramRetry(() => ctx.reply(text, extra), 'sendMessage');
}

async function sendStep(ctx: BotContext, step: SurveyStep) {
  const message = STEP_MESSAGES[step];
  const keyboard = getStepKeyboard(step);

  if (keyboard) {
    await safeReply(ctx, message, { parse_mode: 'Markdown', ...keyboard });
  } else {
    await safeReply(ctx, message, { parse_mode: 'Markdown' });
  }
}

async function ensureUploadDir() {
  if (!fs.existsSync(config.upload.dir)) {
    fs.mkdirSync(config.upload.dir, { recursive: true });
  }
}

async function downloadTelegramFile(
  ctx: BotContext,
  fileId: string,
  prefix: string,
  allowedExt: Set<string>,
  fileSize?: number,
): Promise<string> {
  if (fileSize) {
    validateUploadSize(fileSize);
  }

  await ensureUploadDir();
  const fileLink = await withTelegramRetry(
    () => ctx.telegram.getFileLink(fileId),
    'getFileLink',
  );
  const response = await withTelegramRetry(
    () => fetch(fileLink.href),
    'downloadFile',
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  validateUploadSize(buffer.length);

  const ext = normalizeExtension(path.extname(fileLink.pathname) || '.bin', allowedExt);
  const filename = `${prefix}_${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filePath = path.join(config.upload.dir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

export function setupBot(bot: Telegraf<BotContext>) {
  bot.command('start', async (ctx) => {
    try {
      const { step } = await surveyService.startSurvey(ctx.from!.id, {
        username: ctx.from!.username,
        firstName: ctx.from!.first_name,
        lastName: ctx.from!.last_name,
      });

      await safeReply(ctx, WELCOME_MESSAGE, { parse_mode: 'Markdown' });
      await sendStep(ctx, step);
    } catch (error) {
      logger.error('Start command error', error);
      await safeReply(ctx, 'Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  });

  bot.command('cancel', async (ctx) => {
    await surveyService.cancelSurvey(ctx.from!.id);
    await safeReply(ctx, CANCEL_MESSAGE);
  });

  bot.command('restart', async (ctx) => {
    await surveyService.restartSurvey(ctx.from!.id);
    await safeReply(ctx, RESTART_MESSAGE);
    await sendStep(ctx, 'fullName');
  });

  bot.command('status', async (ctx) => {
    const status = await surveyService.getStatus(ctx.from!.id);
    if (!status) {
      await safeReply(ctx, 'Siz hali anketa boshlamagansiz. /start buyrug\'ini yuboring.');
      return;
    }

    const { stepNumber, totalSteps, stepLabel, user } = status;
    await safeReply(
      ctx,
      `📊 *Holat:* ${user.status}\n📍 *Bosqich:* ${stepNumber}/${totalSteps}\n📝 *Savol:* ${stepLabel}`,
      { parse_mode: 'Markdown' },
    );
  });

  bot.on('callback_query', async (ctx) => {
    if (!('data' in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    if (!data.startsWith('answer:')) return;

    const value = data.slice('answer:'.length);
    await withTelegramRetry(() => ctx.answerCbQuery(), 'answerCbQuery');

    const user = await userRepository.findByTelegramId(ctx.from!.id);
    if (!user || user.status === UserStatus.COMPLETED) {
      await safeReply(ctx, 'Anketa allaqachon tugallangan. /restart bilan qayta boshlang.');
      return;
    }

    const currentStep = user.currentStep;
    if (!isEnumStep(currentStep)) return;

    try {
      const { nextStep, completed } = await surveyService.processAnswer(
        ctx.from!.id,
        currentStep,
        value,
      );

      if (currentStep === 'confirmation' && value === 'Tasdiqlamayman') {
        await safeReply(ctx, REJECTED_MESSAGE);
        return;
      }

      if (completed) {
        await safeReply(ctx, COMPLETED_MESSAGE, { parse_mode: 'Markdown' });
        return;
      }

      await sendStep(ctx, nextStep);
    } catch (error) {
      if (error instanceof ValidationError) {
        await safeReply(ctx, `⚠️ ${error.message}`);
      } else {
        logger.error('Callback query error', error);
        await safeReply(ctx, 'Xatolik yuz berdi.');
      }
    }
  });

  bot.on('document', async (ctx) => {
    const user = await userRepository.findByTelegramId(ctx.from!.id);
    if (!user || user.currentStep !== 'resume') return;

    try {
      const doc = (ctx.message as Message.DocumentMessage).document;
      const filename = await downloadTelegramFile(
        ctx,
        doc.file_id,
        'resume',
        ALLOWED_RESUME_EXT,
        doc.file_size,
      );
      const nextStep = await surveyService.saveResumeFile(ctx.from!.id, filename);
      await safeReply(ctx, '✅ Fayl qabul qilindi!');
      await sendStep(ctx, nextStep);
    } catch (error) {
      logger.error('Document upload error', error);
      await safeReply(ctx, 'Fayl yuklashda xatolik. Qayta urinib ko\'ring.');
    }
  });

  bot.on('photo', async (ctx) => {
    const user = await userRepository.findByTelegramId(ctx.from!.id);
    if (!user || user.currentStep !== 'photo') return;

    try {
      const photos = (ctx.message as Message.PhotoMessage).photo;
      const largest = photos[photos.length - 1];
      const filename = await downloadTelegramFile(
        ctx,
        largest.file_id,
        'photo',
        ALLOWED_PHOTO_EXT,
        largest.file_size,
      );
      const nextStep = await surveyService.savePhotoFile(ctx.from!.id, filename);
      await safeReply(ctx, '✅ Fotosurat qabul qilindi!');
      await sendStep(ctx, nextStep);
    } catch (error) {
      logger.error('Photo upload error', error);
      await safeReply(ctx, 'Fotosurat yuklashda xatolik. Qayta urinib ko\'ring.');
    }
  });

  bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;

    const user = await userRepository.findByTelegramId(ctx.from!.id);
    if (!user) {
      await safeReply(ctx, 'Anketa boshlanmagan. /start buyrug\'ini yuboring.');
      return;
    }

    if (user.status === UserStatus.COMPLETED) {
      await safeReply(ctx, 'Anketa tugallangan. /restart bilan qayta boshlang.');
      return;
    }

    const currentStep = user.currentStep;
    if (!isTextStep(currentStep)) {
      await safeReply(ctx, 'Iltimos, tugmalardan birini tanlang yoki fayl yuboring.');
      return;
    }

    try {
      const { nextStep, completed } = await surveyService.processAnswer(
        ctx.from!.id,
        currentStep,
        ctx.message.text.trim(),
      );

      if (completed) {
        await safeReply(ctx, COMPLETED_MESSAGE, { parse_mode: 'Markdown' });
        return;
      }

      await sendStep(ctx, nextStep);
    } catch (error) {
      if (error instanceof ValidationError) {
        await safeReply(ctx, `⚠️ ${error.message}`);
      } else {
        logger.error('Text handler error', error);
        await safeReply(ctx, 'Xatolik yuz berdi.');
      }
    }
  });
}

export function createBot(): Telegraf<BotContext> | null {
  if (!config.telegram.botToken) {
    logger.warn('TELEGRAM_BOT_TOKEN not set, bot will not start');
    return null;
  }

  const bot = new Telegraf<BotContext>(config.telegram.botToken, getTelegrafOptions());
  setupBot(bot);
  return bot;
}

export async function startBot(bot: Telegraf<BotContext>) {
  bot.catch(async (err, ctx) => {
    logger.error('Unhandled bot error', err);
    try {
      await safeReply(
        ctx,
        'Vaqtinchalik tarmoq xatoligi. Birozdan keyin qayta urinib ko\'ring.',
      );
    } catch {
      // ignore secondary failures
    }
  });

  try {
    const me = await withTelegramRetry(() => bot.telegram.getMe(), 'getMe');
    logger.info(`Telegram bot connected: @${me.username}`);
    await bot.launch();
    logger.info('Telegram bot polling started');
  } catch (error) {
    logTelegramConnectionHint(error);
    throw error;
  }

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
