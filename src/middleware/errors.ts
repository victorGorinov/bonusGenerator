import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from '../errors/AppError.js';

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const appErr = err instanceof AppError ? err : null;
  const status  = appErr?.status ?? 500;
  const body: Record<string, unknown> = {
    code:    appErr?.code    ?? 'INTERNAL_ERROR',
    message: appErr?.isOperational ? appErr.message : 'Internal server error',
  };
  if (appErr && 'details' in appErr && appErr.details !== undefined) body['details'] = appErr.details;
  if (process.env['NODE_ENV'] !== 'production' && err instanceof Error) body['stack'] = err.stack;

  if (status >= 500) {
    logger.error({ event: 'request.error', status, code: body['code'], err });
  }

  res.status(status).json(body);
}
