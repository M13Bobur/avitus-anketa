import mongoose, { Schema, Document } from 'mongoose';
import { AdminRole } from '@avitus/shared-types';

export interface IAdminDocument extends Document {
  username: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdminDocument>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.ADMIN,
    },
  },
  { timestamps: true },
);

export const AdminModel = mongoose.model<IAdminDocument>('Admin', adminSchema);
