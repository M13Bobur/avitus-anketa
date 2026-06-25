import { ApplicationStatus, LEGACY_APPLICATION_STATUS } from '@avitus/shared-types';
import { ApplicationModel } from '../database/models/application.model';
import { logger } from '../../config/logger';

export async function migrateApplicationStatuses(): Promise<void> {
  let totalUpdated = 0;

  for (const [legacy, current] of Object.entries(LEGACY_APPLICATION_STATUS)) {
    const result = await ApplicationModel.updateMany(
      { status: legacy },
      { $set: { status: current } },
    );
    totalUpdated += result.modifiedCount;
  }

  const incompleteResult = await ApplicationModel.updateMany(
    { completed: false },
    { $set: { status: ApplicationStatus.INCOMPLETE } },
  );
  totalUpdated += incompleteResult.modifiedCount;

  if (totalUpdated > 0) {
    logger.info(`Migrated ${totalUpdated} application statuses`);
  }
}
