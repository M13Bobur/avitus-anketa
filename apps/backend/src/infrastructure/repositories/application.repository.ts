import { FilterQuery, Types } from 'mongoose';
import {
  ApplicationStatus,
  ApplicationFilters,
  SurveyAnswers,
  LEGACY_APPLICATION_STATUS,
} from '@avitus/shared-types';
import { escapeRegex } from '../../domain/security';
import {
  ApplicationModel,
  IApplicationDocument,
} from '../database/models/application.model';

function buildStatusFilter(status: ApplicationStatus) {
  const legacy = Object.entries(LEGACY_APPLICATION_STATUS).find(([, value]) => value === status)?.[0];
  return legacy ? { $in: [status, legacy] } : status;
}

export interface IApplicationRepository {
  findByUserId(userId: string): Promise<IApplicationDocument | null>;
  create(userId: string): Promise<IApplicationDocument>;
  updateAnswers(
    userId: string,
    answers: Partial<SurveyAnswers>,
  ): Promise<IApplicationDocument | null>;
  setResumeFile(userId: string, filename: string): Promise<IApplicationDocument | null>;
  setPhotoFile(userId: string, filename: string): Promise<IApplicationDocument | null>;
  complete(userId: string): Promise<IApplicationDocument | null>;
  findById(id: string): Promise<IApplicationDocument | null>;
  findAll(filters: ApplicationFilters): Promise<{
    data: IApplicationDocument[];
    total: number;
  }>;
  updateStatus(
    id: string,
    status: ApplicationStatus,
    adminComment?: string,
  ): Promise<IApplicationDocument | null>;
  getStats(): Promise<{
    total: number;
    today: number;
    completed: number;
    incomplete: number;
  }>;
  deleteByUserId(userId: string): Promise<void>;
}

export class ApplicationRepository implements IApplicationRepository {
  async findByUserId(userId: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findOne({ userId: new Types.ObjectId(userId) });
  }

  async create(userId: string): Promise<IApplicationDocument> {
    return ApplicationModel.create({
      userId: new Types.ObjectId(userId),
      status: ApplicationStatus.INCOMPLETE,
      completed: false,
    });
  }

  async updateAnswers(
    userId: string,
    answers: Partial<SurveyAnswers>,
  ): Promise<IApplicationDocument | null> {
    const setFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(answers)) {
      setFields[`answers.${key}`] = value;
    }
    return ApplicationModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: setFields },
      { new: true, upsert: true },
    );
  }

  async setResumeFile(userId: string, filename: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { resumeFile: filename },
      { new: true },
    );
  }

  async setPhotoFile(userId: string, filename: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { photoFile: filename },
      { new: true },
    );
  }

  async complete(userId: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        completed: true,
        submittedAt: new Date(),
        status: ApplicationStatus.NEW,
      },
      { new: true },
    );
  }

  async findById(id: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findById(id).populate('userId');
  }

  async findAll(filters: ApplicationFilters): Promise<{
    data: IApplicationDocument[];
    total: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const query: FilterQuery<IApplicationDocument> = {};

    if (filters.position) query['answers.position'] = filters.position;
    if (filters.branch) query['answers.branch'] = filters.branch;
    if (filters.gender) query['answers.gender'] = filters.gender;
    if (filters.pharmacyExperience) {
      query['answers.pharmacyExperience'] = filters.pharmacyExperience;
    }
    if (filters.status === ApplicationStatus.INCOMPLETE) {
      query.completed = false;
      query.status = ApplicationStatus.INCOMPLETE;
    } else if (filters.status) {
      query.status = buildStatusFilter(filters.status);
      query.completed = true;
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateField =
        filters.status === ApplicationStatus.INCOMPLETE ? 'updatedAt' : 'submittedAt';
      query[dateField] = {};
      if (filters.dateFrom) query[dateField].$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query[dateField].$lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      const safeSearch = escapeRegex(filters.search.trim());
      query.$or = [
        { 'answers.fullName': { $regex: safeSearch, $options: 'i' } },
        { 'answers.phone': { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      ApplicationModel.find(query)
        .populate('userId')
        .sort({ updatedAt: -1, submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ApplicationModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    adminComment?: string,
  ): Promise<IApplicationDocument | null> {
    const update: Record<string, unknown> = { status };
    if (adminComment !== undefined) update.adminComment = adminComment;
    return ApplicationModel.findByIdAndUpdate(id, update, { new: true }).populate('userId');
  }

  async getStats(): Promise<{
    total: number;
    today: number;
    completed: number;
    incomplete: number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, today, completed, incomplete] = await Promise.all([
      ApplicationModel.countDocuments({ completed: true }),
      ApplicationModel.countDocuments({ completed: true, submittedAt: { $gte: todayStart } }),
      ApplicationModel.countDocuments({ completed: true }),
      ApplicationModel.countDocuments({ completed: false }),
    ]);

    return { total, today, completed, incomplete };
  }

  async deleteByUserId(userId: string): Promise<void> {
    await ApplicationModel.deleteOne({ userId: new Types.ObjectId(userId) });
  }
}

export const applicationRepository = new ApplicationRepository();
