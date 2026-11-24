import {
  FEATURES,
  GUEST_FEATURES,
  ALL_ON,
  fill,
  planFeatures,
  LIMITS,
  GUEST_LIMITS,
  planLimits,
  type Feature,
  type FeatureMap,
  type Limit,
  type LimitMap,
} from '../../config/features.js';

// The DB shape enforcement needs — a subset of the users row.
export interface AccessRow {
  role:     string;                          // 'admin' | 'user'
  status:   string;                          // 'active' | 'disabled'
  plan:     string;                          // tariff preset key
  features: Record<string, unknown> | null;  // per-user overrides (JSONB)
  limits?:  Record<string, unknown> | null;  // per-user NUMERIC overrides (JSONB)
}

// An admin has no quota. Callers compare with `>=`; the wire form maps it to -1
// because JSON.stringify(Infinity) === 'null'.
export const UNLIMITED = Infinity;

// Pure. Given a user's access row (or undefined for a guest), compute the full
// effective feature map. Precedence, highest first:
//   1. disabled  → all off
//   2. admin     → all on
//   3. per-user override (features[k] is a boolean) wins over…
//   4. …the plan preset (planFeatures(plan))
// Guest (no row) → GUEST_FEATURES.
export function resolveFeatureAccess(row?: AccessRow | null): FeatureMap {
  if (!row) return { ...GUEST_FEATURES };
  if (row.status === 'disabled') return fill(false);
  if (row.role === 'admin') return { ...ALL_ON };

  const base = planFeatures(row.plan);
  const overrides = row.features ?? {};
  for (const f of FEATURES) {
    const ov = (overrides as Record<string, unknown>)[f];
    if (typeof ov === 'boolean') base[f] = ov;
  }
  return base;
}

export function hasFeature(row: AccessRow | null | undefined, feature: Feature): boolean {
  return resolveFeatureAccess(row)[feature];
}

// Pure. The numeric twin of resolveFeatureAccess, with identical precedence:
//   1. disabled → every limit 0
//   2. admin    → UNLIMITED
//   3. per-user override (users.limits[k] is a finite number >= 0)
//   4. plan preset (planLimits(plan))
// Guest (no row) → GUEST_LIMITS.
export function resolveLimits(row?: AccessRow | null): LimitMap {
  if (!row) return { ...GUEST_LIMITS };
  if (row.status === 'disabled') return LIMITS.reduce((a, l) => { a[l] = 0; return a; }, {} as LimitMap);
  if (row.role === 'admin') return LIMITS.reduce((a, l) => { a[l] = UNLIMITED; return a; }, {} as LimitMap);

  const base = planLimits(row.plan);
  const overrides = row.limits ?? {};
  for (const l of LIMITS) {
    const ov = (overrides as Record<string, unknown>)[l];
    // A malformed override (NaN/negative/non-numeric JSONB) must never widen or
    // corrupt a quota — it is ignored and the plan preset wins.
    if (typeof ov === 'number' && Number.isFinite(ov) && ov >= 0) base[l] = Math.floor(ov);
  }
  return base;
}

export function limitOf(row: AccessRow | null | undefined, limit: Limit): number {
  return resolveLimits(row)[limit];
}

// Wire form: Infinity has no JSON representation, so unlimited travels as -1.
// The frontend treats a negative value as "no cap".
export function limitsForWire(map: LimitMap): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of LIMITS) out[l] = Number.isFinite(map[l]) ? map[l] : -1;
  return out;
}
