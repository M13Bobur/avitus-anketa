import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/app.error';
import { logger } from '../../config/logger';

function isCastError(err: Error): boolean {
  return err.name === 'CastError';
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (isCastError(err)) {
    return res.status(400).json({
      success: false,
      message: 'Noto\'g\'ri ID format',
    });
  }

  logger.error('Unhandled error', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}
