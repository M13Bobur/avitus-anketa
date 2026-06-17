import {
  ApplicationFilters,
  ApplicationStatus,
  DashboardStats,
  SurveyAnswers,
  SurveyStep,
  UserStatus,
  Confirmation,
} from '@avitus/shared-types';
import { userRepository } from '../../infrastructure/repositories/user.repository';
import { applicationRepository } from '../../infrastructure/repositories/application.repository';
import { getNextStep, getStepNumber, getTotalSteps, getStepLabel } from './survey-fsm.service';
import { surveyValidators } from '../dto/validation.schemas';
import { ValidationError } from '../../domain/errors/app.error';
import { NotFoundError } from '../../domain/errors/app.error';

export class SurveyService {
  async startSurvey(telegramId: number, userData: {
    username?: string;
    firstName?: string;
    lastName?: string;
  }) {
    const user = await userRepository.upsertByTelegramId(telegramId, {
      telegramId,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      currentStep: 'fullName' as SurveyStep,
      status: UserStatus.IN_PROGRESS,
    });

    let application = await applicationRepository.findByUserId(user._id.toString());
    if (!application) {
      application = await applicationRepository.create(user._id.toString());
    }

    return { user, application, step: 'fullName' as SurveyStep };
  }

  async cancelSurvey(telegramId: number) {
    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) return null;

    await userRepository.updateStatus(telegramId, UserStatus.CANCELLED);
    return user;
  }

  async restartSurvey(telegramId: number) {
    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) return null;

    await userRepository.upsertByTelegramId(telegramId, {
      currentStep: 'fullName',
      status: UserStatus.IN_PROGRESS,
    });

    await applicationRepository.deleteByUserId(user._id.toString());
    await applicationRepository.create(user._id.toString());

    return user;
  }

  async getStatus(telegramId: number) {
    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) return null;

    const application = await applicationRepository.findByUserId(user._id.toString());
    const stepNumber = getStepNumber(user.currentStep);
    const totalSteps = getTotalSteps();

    return {
      user,
      application,
      stepNumber,
      totalSteps,
      stepLabel: getStepLabel(user.currentStep),
    };
  }

  validateStepAnswer(step: SurveyStep, value: unknown): unknown {
    const schema = surveyValidators[step];
    if (!schema) return value;

    const result = schema.safeParse(value);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      throw new ValidationError(message);
    }
    return result.data;
  }

  async processAnswer(
    telegramId: number,
    step: SurveyStep,
    value: unknown,
  ): Promise<{ nextStep: SurveyStep; completed: boolean }> {
    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const application = await applicationRepository.findByUserId(user._id.toString());
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const validatedValue = this.validateStepAnswer(step, value);

    if (step === 'confirmation' && validatedValue === Confirmation.REJECT) {
      await userRepository.updateStatus(telegramId, UserStatus.CANCELLED);
      return { nextStep: 'completed', completed: false };
    }

    const answerKey = step as keyof SurveyAnswers;
    await applicationRepository.updateAnswers(user._id.toString(), {
      [answerKey]: validatedValue,
    });

    const updatedAnswers = {
      ...application.answers,
      [answerKey]: validatedValue,
    };

    const nextStep = getNextStep(step, updatedAnswers as Record<string, unknown>);

    if (nextStep === 'completed') {
      await applicationRepository.complete(user._id.toString());
      await userRepository.updateStep(telegramId, 'completed');
      await userRepository.updateStatus(telegramId, UserStatus.COMPLETED);
      return { nextStep: 'completed', completed: true };
    }

    await userRepository.updateStep(telegramId, nextStep);
    return { nextStep, completed: false };
  }

  async saveResumeFile(telegramId: number, filename: string) {
    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) throw new NotFoundError('User not found');

    await applicationRepository.setResumeFile(user._id.toString(), filename);

    const application = await applicationRepository.findByUserId(user._id.toString());
    const nextStep = getNextStep('resume', (application?.answers ?? {}) as Record<string, unknown>);

    await userRepository.updateStep(telegramId, nextStep);
    return nextStep;
  }

  async savePhotoFile(telegramId: number, filename: string) {
    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) throw new NotFoundError('User not found');

    await applicationRepository.setPhotoFile(user._id.toString(), filename);

    const application = await applicationRepository.findByUserId(user._id.toString());
    const nextStep = getNextStep('photo', (application?.answers ?? {}) as Record<string, unknown>);

    await userRepository.updateStep(telegramId, nextStep);
    return nextStep;
  }
}

export class ApplicationService {
  async getStats(): Promise<DashboardStats> {
    const stats = await applicationRepository.getStats();
    return {
      totalApplications: stats.total,
      todayApplications: stats.today,
      completedApplications: stats.completed,
      incompleteApplications: stats.incomplete,
    };
  }

  async getApplications(filters: ApplicationFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { data, total } = await applicationRepository.findAll(filters);

    return {
      data: data.map((app) => this.toDto(app)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getApplicationById(id: string) {
    const app = await applicationRepository.findById(id);
    if (!app) throw new NotFoundError('Application not found');
    return this.toDto(app);
  }

  async updateStatus(id: string, status: ApplicationStatus, adminComment?: string) {
    const app = await applicationRepository.updateStatus(id, status, adminComment);
    if (!app) throw new NotFoundError('Application not found');
    return this.toDto(app);
  }

  private toDto(app: {
    _id: { toString(): string };
    userId: unknown;
    answers: SurveyAnswers;
    resumeFile?: string;
    photoFile?: string;
    completed: boolean;
    status: ApplicationStatus;
    adminComment?: string;
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const user = app.userId as {
      _id?: { toString(): string };
      telegramId?: number;
      username?: string;
      firstName?: string;
      lastName?: string;
    } | null;

    return {
      _id: app._id.toString(),
      userId: user?._id?.toString() ?? String(app.userId),
      answers: app.answers,
      resumeFile: app.resumeFile,
      photoFile: app.photoFile,
      completed: app.completed,
      status: app.status,
      adminComment: app.adminComment,
      submittedAt: app.submittedAt?.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      user: user
        ? {
            _id: user._id?.toString() ?? '',
            telegramId: user.telegramId ?? 0,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : undefined,
    };
  }
}

export const surveyService = new SurveyService();
export const applicationService = new ApplicationService();
