import { logger } from '../utils/logger.js';

export function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const body = {
    code:    err.code    || 'INTERNAL_ERROR',
    message: err.isOperational ? err.message : 'Internal server error',
  };
  if (err.details) body.details = err.details;
  if (process.env.NODE_ENV !== 'production') body.stack = err.stack;

  if (status >= 500) {
    logger.error({ event: 'request.error', status, code: body.code, err });
  }

  res.status(status).json(body);
}
