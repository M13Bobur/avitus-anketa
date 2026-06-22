import { IAdminDocument } from '../database/models/admin.model';
import { AdminModel } from '../database/models/admin.model';
import { AdminRole } from '@avitus/shared-types';

export interface IAdminRepository {
  findByUsername(username: string): Promise<IAdminDocument | null>;
  findById(id: string): Promise<IAdminDocument | null>;
  create(username: string, passwordHash: string, role: AdminRole): Promise<IAdminDocument>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateUsername(id: string, username: string): Promise<void>;
  incrementTokenVersion(id: string): Promise<number>;
  exists(): Promise<boolean>;
}

export class AdminRepository implements IAdminRepository {
  async findByUsername(username: string): Promise<IAdminDocument | null> {
    return AdminModel.findOne({ username });
  }

  async findById(id: string): Promise<IAdminDocument | null> {
    return AdminModel.findById(id);
  }

  async create(
    username: string,
    passwordHash: string,
    role: AdminRole,
  ): Promise<IAdminDocument> {
    return AdminModel.create({ username, passwordHash, role });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await AdminModel.findByIdAndUpdate(id, { passwordHash });
  }

  async updateUsername(id: string, username: string): Promise<void> {
    await AdminModel.findByIdAndUpdate(id, { username });
  }

  async incrementTokenVersion(id: string): Promise<number> {
    const admin = await AdminModel.findByIdAndUpdate(
      id,
      { $inc: { tokenVersion: 1 } },
      { new: true },
    );
    return admin?.tokenVersion ?? 0;
  }

  async exists(): Promise<boolean> {
    const count = await AdminModel.countDocuments();
    return count > 0;
  }
}

export const adminRepository = new AdminRepository();
