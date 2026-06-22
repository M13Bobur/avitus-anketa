import { AdminRole } from '@avitus/shared-types';

const roleLevel: Record<AdminRole, number> = {
  [AdminRole.VIEWER]: 1,
  [AdminRole.ADMIN]: 2,
  [AdminRole.SUPER_ADMIN]: 3,
};

export function hasMinRole(role: AdminRole, minRole: AdminRole): boolean {
  return roleLevel[role] >= roleLevel[minRole];
}
