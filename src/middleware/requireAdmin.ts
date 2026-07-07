import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { pool } from '../db/client.js';
import { resolveUser } from './authCookie.js';
import { getUserAccessById } from '../use-cases/Auth.js';

// Hard gate for /api/admin/*. Self-contained (resolves the cookie itself, no
// upstream optionalAuth needed). Role is read from the DB, not the JWT, so
// revoking an admin takes effect on their next request. Attaches req.user and
// req.adminId so downstream handlers can enforce self-protection rules
// (can't demote/disable/delete yourself, can't remove the last admin).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { adminId?: string }
  }
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const u = resolveUser(req);
    if (!u) {
      next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
      return;
    }
    const row = await getUserAccessById(pool, u.id);
    if (!row || row.status === 'disabled' || row.role !== 'admin') {
      next(new AppError('Admin access required', 403, 'FORBIDDEN'));
      return;
    }
    req.user = u;
    req.adminId = u.id;
    next();
  } catch (err) {
    next(err);
  }
}
