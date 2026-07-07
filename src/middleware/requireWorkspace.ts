import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import { AppError } from '../errors/AppError.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { workspaceId?: string }
  }
}

// 1 workspace per user in this phase, owner_id is immutable → the mapping never
// changes for the process lifetime, so an in-memory cache avoids a DB round-trip
// on every persisted-data request. Bounded so a long-lived process serving many
// distinct accounts can't grow the Map without limit: past WS_CACHE_MAX we evict
// the oldest entry (Map preserves insertion order → FIFO). Re-fetching an evicted
// user is a single indexed SELECT, so the cap trades a rare miss for bounded memory.
const WS_CACHE_MAX = 10_000;
const wsCache = new Map<string, string>();

function cacheWorkspace(userId: string, workspaceId: string): void {
  if (wsCache.size >= WS_CACHE_MAX) {
    const oldest = wsCache.keys().next().value;
    if (oldest !== undefined) wsCache.delete(oldest);
  }
  wsCache.set(userId, workspaceId);
}

/**
 * Must run after requireAuth. Resolves the caller's workspace_id from req.user.id
 * and attaches it as req.workspaceId. 500 if an authenticated user somehow has no
 * workspace (registration always creates one in the same transaction, so this is
 * a data-integrity failure, not an expected client error).
 */
export function createRequireWorkspace({ db }: { db: Pool }) {
  return async function requireWorkspace(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
        return;
      }
      const cached = wsCache.get(req.user.id);
      if (cached) {
        req.workspaceId = cached;
        next();
        return;
      }
      const res = await db.query<{ id: string }>(
        'SELECT id FROM workspaces WHERE owner_id = $1',
        [req.user.id],
      );
      const ws = res.rows[0];
      if (!ws) {
        next(new AppError('Workspace not found for user', 500, 'INTERNAL_ERROR'));
        return;
      }
      cacheWorkspace(req.user.id, ws.id);
      req.workspaceId = ws.id;
      next();
    } catch (err) {
      next(err);
    }
  };
}
