import { Request, Response, NextFunction } from 'express';
import { authService, JwtPayload } from '../../application/services/auth.service';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/app.error';
import { AdminRole } from '@avitus/shared-types';

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.slice(7);
  try {
    req.admin = authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

const roleHierarchy: Record<AdminRole, number> = {
  [AdminRole.VIEWER]: 1,
  [AdminRole.ADMIN]: 2,
  [AdminRole.SUPER_ADMIN]: 3,
};

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new UnauthorizedError());
    }

    const adminRole = req.admin.role;
    const hasRole = roles.some(
      (role) => roleHierarchy[adminRole] >= roleHierarchy[role],
    );

    if (!hasRole) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

export function requireMinRole(minRole: AdminRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new UnauthorizedError());
    }

    if (roleHierarchy[req.admin.role] < roleHierarchy[minRole]) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}
