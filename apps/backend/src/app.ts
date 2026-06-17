import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// @ts-expect-error no types
import xss from 'xss-clean';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { logger } from './config/logger';
import { requestLogger } from './presentation/middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './presentation/middleware/error.middleware';
import apiRoutes from './presentation/routes/api.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
  }));

  app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, message: 'Too many requests' },
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(mongoSanitize());
  app.use(xss());

  app.use(requestLogger);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', apiRoutes);

  const adminDistPath = config.adminDistPath;
  if (fs.existsSync(adminDistPath)) {
    logger.info(`Serving admin panel from: ${adminDistPath}`);
    app.use(express.static(adminDistPath, { index: false }));

    app.get(/^\/(?!api).*/, (req, res, next) => {
      if (req.path.startsWith('/api')) return next();

      const normalizedPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
      const htmlPath = path.join(adminDistPath, normalizedPath, 'index.html');
      const rootIndex = path.join(adminDistPath, 'index.html');

      if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
      }
      if (fs.existsSync(rootIndex)) {
        return res.sendFile(rootIndex);
      }
      next();
    });
  } else {
    logger.warn(`Admin dist not found at: ${adminDistPath}`);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
