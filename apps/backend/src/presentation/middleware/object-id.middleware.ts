import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ValidationError } from '../../domain/errors/app.error';

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id)
    && new mongoose.Types.ObjectId(id).toString() === id;
}

export function validateObjectIdParam(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const id = String(req.params[paramName]);
    if (!isValidObjectId(id)) {
      return next(new ValidationError('Noto\'g\'ri ID format'));
    }
    next();
  };
}
