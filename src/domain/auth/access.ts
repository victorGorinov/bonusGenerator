import {
  FEATURES,
  GUEST_FEATURES,
  ALL_ON,
  fill,
  planFeatures,
  type Feature,
  type FeatureMap,
} from '../../config/features.js';

// The DB shape enforcement needs — a subset of the users row.
export interface AccessRow {
  role:     string;                          // 'admin' | 'user'
  status:   string;                          // 'active' | 'disabled'
  plan:     string;                          // tariff preset key
  features: Record<string, unknown> | null;  // per-user overrides (JSONB)
}

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
