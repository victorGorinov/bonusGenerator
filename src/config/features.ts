// Feature-access model — the single source of truth for what each caller can use.
//
// Effective access is resolved as a LAYERED computation (see domain/auth/access.ts):
//   guest            → GUEST_FEATURES
//   registered user  → FEATURE_PRESETS[user.plan]  ⊕  user.features (per-user overrides)
//   admin            → everything on (short-circuit)
//   disabled user    → everything off (short-circuit)
//
// This is the seam for future tariff plans: a plan is just a named preset here.
// Adding a tier later = add a row to FEATURE_PRESETS + a plan selector in the
// admin UI — no changes to enforcement, routes, or the DB schema (plan is a
// column already). Per-user `features` stays an OVERRIDE layer on top of the
// plan (absent key = inherit the plan's value), so changing a user's plan
// automatically changes their access wherever no explicit override is set.

export const FEATURES = [
  'bonus',
  'campaign',
  'tournament',
  'loyalty',
  'wheel',
  'games',
  'competitorComparison',
  'reports',
  'calendar',
] as const;

export type Feature = (typeof FEATURES)[number];
export type FeatureMap = Record<Feature, boolean>;

export function fill(value: boolean): FeatureMap {
  return FEATURES.reduce((acc, f) => { acc[f] = value; return acc; }, {} as FeatureMap);
}

export const ALL_ON: FeatureMap = fill(true);

// Guests (no session cookie): basic generators only. Loyalty / Reports / Calendar
// require an account. Trim/extend this set here — it's the only place it lives.
export const GUEST_FEATURES: FeatureMap = {
  bonus:      true,
  campaign:   true,
  tournament: true,
  wheel:      true,
  games:      true,
  loyalty:    false,
  // Closed to guests: live AI web search costs money per call, so competitor
  // analysis requires an account.
  competitorComparison: false,
  reports:    false,
  calendar:   false,
};

// Tariff presets. `free` == everything-on today, so introducing plans doesn't
// change behaviour for existing registered users (all currently get full access).
// When real tiers ship, trim `free` and flesh out `pro`; enforcement is unchanged.
export const FEATURE_PRESETS: Record<string, FeatureMap> = {
  free: { ...ALL_ON },
  pro:  { ...ALL_ON },
};

export const DEFAULT_PLAN = 'free';

// The set a registered user gets before any per-user override — driven by plan.
export function planFeatures(plan: string | null | undefined): FeatureMap {
  return { ...(FEATURE_PRESETS[plan ?? DEFAULT_PLAN] ?? FEATURE_PRESETS[DEFAULT_PLAN]) };
}

export function isFeature(x: unknown): x is Feature {
  return typeof x === 'string' && (FEATURES as readonly string[]).includes(x);
}
