import type { Request, Response, NextFunction } from 'express';
import { resolveUser } from './authCookie.js';

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  req.user = resolveUser(req);
  next();
}
