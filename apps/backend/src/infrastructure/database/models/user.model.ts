import mongoose, { Schema, Document } from 'mongoose';
import { UserStatus, SurveyStep } from '@avitus/shared-types';

export interface IUserDocument extends Document {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  currentStep: SurveyStep;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    currentStep: { type: String, default: 'fullName' },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.NEW },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
