import { ApplicationStatus } from '@avitus/shared-types';

export const statusColors: Record<
  ApplicationStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  [ApplicationStatus.NEW]: 'default',
  [ApplicationStatus.REVIEWING]: 'warning',
  [ApplicationStatus.INTERVIEW]: 'secondary',
  [ApplicationStatus.ACCEPTED]: 'success',
  [ApplicationStatus.REJECTED]: 'destructive',
};

export function normalizeApplicationStatus(status: string): ApplicationStatus {
  if (Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
    return status as ApplicationStatus;
  }
  return ApplicationStatus.NEW;
}
