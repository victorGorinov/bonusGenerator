import { ValidationError } from '../errors/ValidationError.js';

export const validate = schema => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError('Validation failed', result.error.flatten()));
  }
  req.body = result.data;
  next();
};
