import mongoose, { Schema, Document, Types } from 'mongoose';
import { ApplicationStatus, SurveyAnswers } from '@avitus/shared-types';

export interface IApplicationDocument extends Document {
  userId: Types.ObjectId;
  answers: SurveyAnswers;
  resumeFile?: string;
  photoFile?: string;
  completed: boolean;
  status: ApplicationStatus;
  adminComment?: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplicationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    resumeFile: { type: String },
    photoFile: { type: String },
    completed: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.INCOMPLETE,
      index: true,
    },
    adminComment: { type: String },
    submittedAt: { type: Date },
  },
  { timestamps: true },
);

applicationSchema.index({ 'answers.position': 1 });
applicationSchema.index({ 'answers.branch': 1 });
applicationSchema.index({ 'answers.gender': 1 });
applicationSchema.index({ 'answers.pharmacyExperience': 1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ updatedAt: -1 });

export const ApplicationModel = mongoose.model<IApplicationDocument>(
  'Application',
  applicationSchema,
);
