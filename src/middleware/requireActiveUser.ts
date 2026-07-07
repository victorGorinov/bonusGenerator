import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import { assertActiveUser } from '../use-cases/Auth.js';

// Must run after requireAuth. Rejects a disabled account (403 ACCOUNT_DISABLED)
// on the requireAuth-only persistence routes, which otherwise only decode the
// JWT and never consult users.status — so disabling a user takes effect on their
// saved-data access immediately, not only after their token expires.
export function createRequireActiveUser({ db }: { db: Pool }) {
  return async function requireActiveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { next(); return; } // requireAuth already ran; nothing to check
      await assertActiveUser(db, req.user.id);
      next();
    } catch (err) {
      next(err);
    }
  };
}
