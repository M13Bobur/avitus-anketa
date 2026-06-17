import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectDatabase, disconnectDatabase } from '../infrastructure/database/connection';
import { authService } from '../application/services/auth.service';
import { config } from '../config';
import { logger } from '../config/logger';

async function seed() {
  try {
    await connectDatabase();

    await authService.seedDefaultAdmin(
      config.seed.adminUsername,
      config.seed.adminPassword,
    );

    logger.info(`Admin seeded: username="${config.seed.adminUsername}"`);
    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Seed failed', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seed();
