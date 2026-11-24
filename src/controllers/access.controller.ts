import type { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getUserAccessById } from '../use-cases/Auth.js';
import { resolveFeatureAccess, resolveLimits, limitsForWire } from '../domain/auth/access.js';
import { BETA_LOCKDOWN } from '../config/index.js';

interface Deps { db: Pool }

// GET /api/features — the caller's EFFECTIVE feature map (guest or logged-in),
// so the frontend knows which tools/tabs to show. optionalAuth upstream sets
// req.user; no auth required (guests get GUEST_FEATURES). One indexed SELECT for
// a logged-in caller, zero for a guest.
export function createAccessController({ db }: Deps) {
  return {
    features: asyncHandler(async (req, res) => {
      const uid = req.user?.id;
      const row = uid ? await getUserAccessById(db, uid) : null;
      const access = resolveFeatureAccess(uid ? row : undefined);
      res.json({
        authenticated: !!(uid && row),
        role:     row?.role ?? null,
        plan:     row?.plan ?? null,
        features: access,
        // Numeric quotas (brands). Unlimited travels as -1 — Infinity has no JSON
        // representation; the frontend treats a negative value as "no cap".
        limits:   limitsForWire(resolveLimits(uid ? row : undefined)),
        // Frontend auth-guard bounces guests to /login.html only when this is on.
        betaLockdown: BETA_LOCKDOWN,
      });
    }),
  };
}
