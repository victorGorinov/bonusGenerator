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

// Same contract as validate() but for query params (GET routes). Parsed result is
// stashed on req.validatedQuery (req.query can be a read-only getter in Express 5).
export const validateQuery = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction): void => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    next(new ValidationError('Validation failed', result.error.flatten()));
    return;
  }
  req.validatedQuery = result.data;
  next();
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { validatedQuery?: unknown }
  }
}
