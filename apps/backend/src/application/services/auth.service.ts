import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { adminRepository } from '../../infrastructure/repositories/admin.repository';
import { UnauthorizedError } from '../../domain/errors/app.error';
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
}

export const authService = new AuthService();
