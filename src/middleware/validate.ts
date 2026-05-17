import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema } from 'zod';
import { ValidationError } from '../errors/ValidationError.js';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    next(new ValidationError('Validation failed', result.error.flatten()));
    return;
  }
  req.body = result.data;
  next();
};
