import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { pool } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { getUserAccessById, type UserWithAccess } from '../use-cases/Auth.js';
import { resolveFeatureAccess } from '../domain/auth/access.js';
import type { Feature } from '../config/features.js';

// Short-TTL cache of the access row, keyed by user id. The Configurator fires
// /api/recalc (and /api/generate) on every slider move; without this each cheap
// (~1ms) request would pay a Neon round-trip to re-read the same unchanged row.
// TTL is deliberately small so an admin's disable / plan-change / feature toggle
// still applies within a few seconds (the requireAuth-only /api/saved + login
// paths enforce 'disabled' with no cache, so revocation there is immediate).
const ACCESS_TTL_MS  = 5_000;
const ACCESS_CACHE_MAX = 10_000;
const accessCache = new Map<string, { row: UserWithAccess | null; exp: number }>();

function getCachedRow(uid: string): { row: UserWithAccess | null } | undefined {
  const e = accessCache.get(uid);
  if (e && e.exp > Date.now()) return e;
  if (e) accessCache.delete(uid); // expired
  return undefined;
}

function cacheRow(uid: string, row: UserWithAccess | null): void {
  if (accessCache.size >= ACCESS_CACHE_MAX) {
    const oldest = accessCache.keys().next().value; // FIFO (Map preserves insertion order)
    if (oldest !== undefined) accessCache.delete(oldest);
  }
  accessCache.set(uid, { row, exp: Date.now() + ACCESS_TTL_MS });
}

// Gate a route on a single feature. MUST run after optionalAuth (reads req.user).
// Guest → GUEST_FEATURES, no DB hit. Logged-in → cached access row.
//
// Failure handling distinguishes two cases so the fallback can never ELEVATE:
//   • row === null  (no such user — deleted account, or a malformed token whose
//     `sub` isn't a real user) → treat as guest. Safe: a non-existent user has
//     no per-user overrides, so this can't grant more than the guest baseline.
//   • lookup THREW (transient DB error) → FAIL CLOSED (503). We can't rule out a
//     restrictive per-user override (e.g. features:{bonus:false}), so falling
//     back to the guest set here could serve a route the user is barred from.
export function requireFeature(feature: Feature) {
  return async function requireFeatureMw(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const uid = req.user?.id;
    let row: UserWithAccess | null = null;
    if (uid) {
      const cached = getCachedRow(uid);
      if (cached) {
        row = cached.row;
      } else {
        try {
          row = await getUserAccessById(pool, uid);
        } catch (err) {
          logger.error({ event: 'access.lookup_failed', uid, err }, 'Feature access lookup failed');
          next(new AppError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE'));
          return;
        }
        cacheRow(uid, row);
      }
    }
    const access = resolveFeatureAccess(row ?? undefined);
    if (!access[feature]) {
      next(new AppError('This feature is not available on your plan', 403, 'FEATURE_FORBIDDEN'));
      return;
    }
    next();
  };
}
