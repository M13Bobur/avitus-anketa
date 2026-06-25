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
import { connectAndLaunchBot } from './launch-bot';
import { notifyAdminsNewApplication } from '../admin-bot/notify-new-application';
import {
  extensionForType,
  validatePhotoContent,
  validateResumeContent,
  type DetectedFileType,
} from '../domain/file-validation';

type BotContext = Context<Update>;

function validateUploadSize(bytes: number) {
  const maxBytes = config.upload.maxFileSizeMb * 1024 * 1024;
  if (bytes > maxBytes) {
    throw new ValidationError(
      `Fayl hajmi ${config.upload.maxFileSizeMb} MB dan oshmasligi kerak`,
    );
  }
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
  validateContent: (buffer: Buffer, mimeType?: string) => DetectedFileType,
  fileSize?: number,
  mimeType?: string,
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

  const detectedType = validateContent(buffer, mimeType);
  const ext = extensionForType(detectedType);
  const filename = `${prefix}_${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filePath = path.join(config.upload.dir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

async function handleUploadError(ctx: BotContext, error: unknown, fallbackMessage: string) {
  if (error instanceof ValidationError) {
    await safeReply(ctx, `⚠️ ${error.message}`);
    return;
  }

  logger.error(fallbackMessage, error);
  await safeReply(ctx, `${fallbackMessage}. Qayta urinib ko'ring.`);
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
    await withTelegramRetry(() => ctx.answerCbQuery(), 'answerCbQuery');

    const user = await userRepository.findByTelegramId(ctx.from!.id);
    if (!user || user.status === UserStatus.COMPLETED) {
      await safeReply(ctx, 'Anketa allaqachon tugallangan. /restart bilan qayta boshlang.');
      return;
    }

    if (data.startsWith('skip:')) {
      const step = data.slice('skip:'.length);
      try {
        if (step === 'references' && user.currentStep === 'references') {
          const nextStep = await surveyService.skipReferences(ctx.from!.id);
          await sendStep(ctx, nextStep);
          return;
        }
        if (step === 'resume' && user.currentStep === 'resume') {
          const nextStep = await surveyService.skipResume(ctx.from!.id);
          await sendStep(ctx, nextStep);
          return;
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          await safeReply(ctx, `⚠️ ${error.message}`);
        } else {
          logger.error('Skip step error', error);
          await safeReply(ctx, 'Xatolik yuz berdi.');
        }
      }
      return;
    }

    if (!data.startsWith('answer:')) return;

    const value = data.slice('answer:'.length);

    const currentStep = user.currentStep;
    if (!isEnumStep(currentStep)) return;

    try {
      const { nextStep, completed, applicationId } = await surveyService.processAnswer(
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
        if (applicationId) {
          void notifyAdminsNewApplication(applicationId);
        }
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
    if (!user || user.status === UserStatus.COMPLETED) return;

    const doc = (ctx.message as Message.DocumentMessage).document;
    const currentStep = user.currentStep;

    if (currentStep === 'resume') {
      try {
        const filename = await downloadTelegramFile(
          ctx,
          doc.file_id,
          'resume',
          validateResumeContent,
          doc.file_size,
          doc.mime_type,
        );
        const nextStep = await surveyService.saveResumeFile(ctx.from!.id, filename);
        await safeReply(ctx, '✅ Fayl qabul qilindi!');
        await sendStep(ctx, nextStep);
      } catch (error) {
        await handleUploadError(ctx, error, 'Fayl yuklashda xatolik');
      }
      return;
    }

    if (currentStep === 'photo') {
      try {
        const filename = await downloadTelegramFile(
          ctx,
          doc.file_id,
          'photo',
          validatePhotoContent,
          doc.file_size,
          doc.mime_type,
        );
        const nextStep = await surveyService.savePhotoFile(ctx.from!.id, filename);
        await safeReply(ctx, '✅ Fotosurat qabul qilindi!');
        await sendStep(ctx, nextStep);
      } catch (error) {
        await handleUploadError(ctx, error, 'Fotosurat yuklashda xatolik');
      }
      return;
    }
  });

  bot.on('photo', async (ctx) => {
    const user = await userRepository.findByTelegramId(ctx.from!.id);
    if (!user || user.status === UserStatus.COMPLETED) return;

    const currentStep = user.currentStep;

    if (currentStep === 'resume') {
      await safeReply(
        ctx,
        '⚠️ Rezyume uchun PDF yoki Word (DOC/DOCX) fayl yuboring, rasm emas.',
      );
      return;
    }

    if (currentStep !== 'photo') return;

    try {
      const photos = (ctx.message as Message.PhotoMessage).photo;
      const largest = photos[photos.length - 1];
      const filename = await downloadTelegramFile(
        ctx,
        largest.file_id,
        'photo',
        validatePhotoContent,
        largest.file_size,
      );
      const nextStep = await surveyService.savePhotoFile(ctx.from!.id, filename);
      await safeReply(ctx, '✅ Fotosurat qabul qilindi!');
      await sendStep(ctx, nextStep);
    } catch (error) {
      await handleUploadError(ctx, error, 'Fotosurat yuklashda xatolik');
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
      const { nextStep, completed, applicationId } = await surveyService.processAnswer(
        ctx.from!.id,
        currentStep,
        ctx.message.text.trim(),
      );

      if (completed) {
        await safeReply(ctx, COMPLETED_MESSAGE, { parse_mode: 'Markdown' });
        if (applicationId) {
          void notifyAdminsNewApplication(applicationId);
        }
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
    await connectAndLaunchBot(bot, 'Survey bot');
  } catch (error) {
    logTelegramConnectionHint(error);
    throw error;
  }
}
