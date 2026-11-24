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
  // Umbrella flag for ALL AI-backed actions (texts/audit/optimize/description/
  // missions/competitor). OFF for guests (keeps the anonymous budget-burn hole
  // closed). BETA: temporarily ON by default for registered accounts (the `free`
  // preset below) so every tester can use the AI tools without a manual grant. A
  // per-user override (features.ai = false) still revokes it individually; admin
  // grants it regardless. Gated on top of each tool's own feature, so deterministic
  // generate/recalc stay open while the AI sub-actions require this flag.
  'ai',
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
  // AI never open to guests — every AI action must be paid for; a granted account
  // is required. (Closes the anonymous budget-burn hole.)
  ai:         false,
};

// Tariff presets — the grid in PRICING.md §2 ("Наполнение").
//
// BETA NOTE: `free` is deliberately everything-ON (AI included during the beta,
// see below), NOT the trimmed Free row from PRICING.md. Every beta account is on
// `free`; trimming it would revoke Loyalty/Calendar/Reports (and now AI) from live
// testers mid-beta. Flipping it to the paid grid is a one-line change here when
// billing ships — enforcement, routes and schema stay untouched.
export const FEATURE_PRESETS: Record<string, FeatureMap> = {
  // `free` == everything-on, INCLUDING `ai`. BETA (temporary): AI is on by default
  // for every registered account so testers can use the AI tools without a per-user
  // grant. Flip back to `{ ...ALL_ON, ai: false }` to gate AI behind a grant again
  // (guests are unaffected — GUEST_FEATURES.ai stays false). A per-user
  // features:{ai:false} override still revokes it individually.
  free: { ...ALL_ON },

  // ── PRICING.md tiers ───────────────────────────────────────────────────────
  // Starter $49 — save/persistence, Calendar, Loyalty, AI (100 calls/mo; the
  // monthly quota itself is NOT enforced yet, see PRICING.md §6 risk #1).
  // No competitor comparison (live web search is the priciest call), no Reports.
  starter: {
    ...ALL_ON,
    competitorComparison: false,
    reports:              false,
  },
  // Growth $249 — everything, unlimited AI.
  growth:   { ...ALL_ON },
  // Agency $599 — everything (multi-seat/multi-brand is a LIMIT, not a feature).
  agency:   { ...ALL_ON },
  // Platform / white-label — everything; real terms are per contract, expressed
  // through per-user overrides (features + limits).
  platform: { ...ALL_ON },

  // Legacy key kept so any account already stamped 'pro' keeps full access.
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

// ── NUMERIC limits ────────────────────────────────────────────────────────────
// The numeric sibling of the boolean feature map. Same layered resolution
// (see domain/auth/access.ts → resolveLimits):
//   disabled → all zero · admin → unlimited · per-user override → plan preset
// Per-user overrides live in users.limits JSONB (e.g. {"brands": 5}), so an
// individual deal ("Growth plus two brands") needs no new tariff.

export const LIMITS = ['brands'] as const;
export type Limit = (typeof LIMITS)[number];
export type LimitMap = Record<Limit, number>;

// Brand quota is the headline value metric in PRICING.md §2 — the whole grid is
// priced per brand, so this table is the money-facing part of the config.
export const PLAN_LIMITS: Record<string, LimitMap> = {
  free:     { brands: 1 },   // one brand = "try the mechanic"; more is the upgrade path
  starter:  { brands: 1 },
  growth:   { brands: 3 },
  agency:   { brands: 10 },
  platform: { brands: 50 },  // contract-level; the real number is a per-user override
  pro:      { brands: 3 },   // legacy key ≈ growth
};

// Guests have no account, so nothing is stored server-side. The frontend still
// keeps ONE brand in localStorage so the prefill is demoable before signup; it
// migrates to the account on registration (same one-shot path as saved items).
export const GUEST_LIMITS: LimitMap = { brands: 0 };

export function planLimits(plan: string | null | undefined): LimitMap {
  return { ...(PLAN_LIMITS[plan ?? DEFAULT_PLAN] ?? PLAN_LIMITS[DEFAULT_PLAN]) };
}

export function isLimit(x: unknown): x is Limit {
  return typeof x === 'string' && (LIMITS as readonly string[]).includes(x);
}
