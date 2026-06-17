import { IUserDocument } from '../database/models/user.model';
import { UserModel } from '../database/models/user.model';
import { SurveyStep, UserStatus } from '@avitus/shared-types';

export interface IUserRepository {
  findByTelegramId(telegramId: number): Promise<IUserDocument | null>;
  create(data: Partial<IUserDocument>): Promise<IUserDocument>;
  updateStep(telegramId: number, step: SurveyStep): Promise<IUserDocument | null>;
  updateStatus(telegramId: number, status: UserStatus): Promise<IUserDocument | null>;
  upsertByTelegramId(
    telegramId: number,
    data: Partial<IUserDocument>,
  ): Promise<IUserDocument>;
}

export class UserRepository implements IUserRepository {
  async findByTelegramId(telegramId: number): Promise<IUserDocument | null> {
    return UserModel.findOne({ telegramId });
  }

  async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    return UserModel.create(data);
  }

  async updateStep(telegramId: number, step: SurveyStep): Promise<IUserDocument | null> {
    return UserModel.findOneAndUpdate(
      { telegramId },
      { currentStep: step, status: UserStatus.IN_PROGRESS },
      { new: true },
    );
  }

  async updateStatus(telegramId: number, status: UserStatus): Promise<IUserDocument | null> {
    return UserModel.findOneAndUpdate({ telegramId }, { status }, { new: true });
  }

  async upsertByTelegramId(
    telegramId: number,
    data: Partial<IUserDocument>,
  ): Promise<IUserDocument> {
    return UserModel.findOneAndUpdate(
      { telegramId },
      { $set: data },
      { new: true, upsert: true },
    );
  }
}

export const userRepository = new UserRepository();
