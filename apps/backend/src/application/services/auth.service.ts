import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { adminRepository } from '../../infrastructure/repositories/admin.repository';
import { UnauthorizedError, NotFoundError, ValidationError, ConflictError } from '../../domain/errors/app.error';
import { validatePasswordStrength, assertSeedPasswordSafe } from '../../domain/security';
import { AdminRole } from '@avitus/shared-types';
import { IAdminDocument } from '../../infrastructure/database/models/admin.model';
import { isProduction } from '../../config';

const JWT_ALGORITHM = 'HS256' as const;

export interface JwtPayload {
  sub: string;
  username: string;
  role: AdminRole;
  tv: number;
}

export class AuthService {
  private createToken(admin: IAdminDocument): string {
    const payload: JwtPayload = {
      sub: admin._id.toString(),
      username: admin.username,
      role: admin.role,
      tv: admin.tokenVersion ?? 0,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: JWT_ALGORITHM,
    } as jwt.SignOptions);
  }

  async login(username: string, password: string): Promise<{ token: string; admin: IAdminDocument }> {
    const admin = await adminRepository.findByUsername(username);
    if (!admin) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return { token: this.createToken(admin), admin };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret, {
        algorithms: [JWT_ALGORITHM],
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async resolveAuthenticatedAdmin(payload: JwtPayload): Promise<JwtPayload> {
    const admin = await adminRepository.findById(payload.sub);
    if (!admin) {
      throw new UnauthorizedError('Admin topilmadi');
    }

    const tokenVersion = payload.tv ?? 0;
    if ((admin.tokenVersion ?? 0) !== tokenVersion) {
      throw new UnauthorizedError('Sessiya muddati tugagan — qayta kiring');
    }

    return {
      sub: admin._id.toString(),
      username: admin.username,
      role: admin.role,
      tv: admin.tokenVersion ?? 0,
    };
  }

  async hashPassword(password: string): Promise<string> {
    validatePasswordStrength(password);
    return bcrypt.hash(password, 12);
  }

  async seedDefaultAdmin(username: string, password: string): Promise<void> {
    const exists = await adminRepository.exists();
    if (exists) return;

    if (isProduction) {
      assertSeedPasswordSafe(password);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await adminRepository.create(username, passwordHash, AdminRole.SUPER_ADMIN);
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ token: string; admin: IAdminDocument }> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin topilmadi');
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new ValidationError('Joriy parol noto\'g\'ri');
    }

    validatePasswordStrength(newPassword);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await adminRepository.updatePassword(adminId, passwordHash);
    await adminRepository.incrementTokenVersion(adminId);

    const updated = await adminRepository.findById(adminId);
    if (!updated) {
      throw new NotFoundError('Admin topilmadi');
    }

    return { token: this.createToken(updated), admin: updated };
  }

  async changeUsername(
    adminId: string,
    currentPassword: string,
    newUsername: string,
  ): Promise<{ token: string; admin: IAdminDocument }> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin topilmadi');
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new ValidationError('Parol noto\'g\'ri');
    }

    const username = newUsername.trim();
    if (username === admin.username) {
      throw new ValidationError('Yangi login joriy logindan farqli bo\'lishi kerak');
    }

    const existing = await adminRepository.findByUsername(username);
    if (existing && existing._id.toString() !== adminId) {
      throw new ConflictError('Bu login allaqachon band');
    }

    await adminRepository.updateUsername(adminId, username);
    await adminRepository.incrementTokenVersion(adminId);

    const updated = await adminRepository.findById(adminId);
    if (!updated) {
      throw new NotFoundError('Admin topilmadi');
    }

    return { token: this.createToken(updated), admin: updated };
  }

  async authenticateTelegram(
    password: string,
    telegramId: number,
  ): Promise<IAdminDocument> {
    const existingByTelegram = await adminRepository.findByTelegramId(telegramId);
    if (existingByTelegram) {
      return existingByTelegram;
    }

    const admins = await adminRepository.findAll();
    for (const admin of admins) {
      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) continue;

      await adminRepository.linkTelegramId(admin._id.toString(), telegramId);
      const updated = await adminRepository.findById(admin._id.toString());
      if (!updated) {
        throw new NotFoundError('Admin topilmadi');
      }
      return updated;
    }

    throw new UnauthorizedError('Parol noto\'g\'ri');
  }

  async getAdminByTelegramId(telegramId: number): Promise<IAdminDocument | null> {
    return adminRepository.findByTelegramId(telegramId);
  }
}

export const authService = new AuthService();
