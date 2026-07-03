import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { resolveUser } from './authCookie.js';

export { AUTH_COOKIE } from './authCookie.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = resolveUser(req);
  if (!user) {
    next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    return;
  }
  req.user = user;
  next();
}
