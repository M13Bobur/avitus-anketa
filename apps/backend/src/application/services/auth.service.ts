import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { adminRepository } from '../../infrastructure/repositories/admin.repository';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../domain/errors/app.error';
import { AdminRole } from '@avitus/shared-types';
import { IAdminDocument } from '../../infrastructure/database/models/admin.model';

export interface JwtPayload {
  sub: string;
  username: string;
  role: AdminRole;
}

export class AuthService {
  async login(username: string, password: string): Promise<{ token: string; admin: IAdminDocument }> {
    const admin = await adminRepository.findByUsername(username);
    if (!admin) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: admin._id.toString(),
      username: admin.username,
      role: admin.role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    return { token, admin };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async seedDefaultAdmin(username: string, password: string): Promise<void> {
    const exists = await adminRepository.exists();
    if (exists) return;

    const passwordHash = await this.hashPassword(password);
    await adminRepository.create(username, passwordHash, AdminRole.SUPER_ADMIN);
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin topilmadi');
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new ValidationError('Joriy parol noto\'g\'ri');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await adminRepository.updatePassword(adminId, passwordHash);
  }
}

export const authService = new AuthService();
