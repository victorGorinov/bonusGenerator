// Bonus parameter benchmarks — recommended ranges + regulatory caps per geo/license.
//
// Provenance: researched 2026-07-19 from market-practice + regulatory sources.
// Wager-by-geo data is firm (see tasks/param-explainability-plan.md for the source
// list); match%/reload/NDB are geo-independent market norms; UK/DK caps and the
// BR prohibition are regulatory facts, not soft recommendations.
//
// This module is the single source of truth. `public/bonus-benchmarks.js` mirrors it
// verbatim for the browser (parity-tested in tests/domain/bonus.benchmarks.parity.test.js).

export type BenchBand = { min: number; rec: number; max: number };
export type BenchUnit = 'x' | '%' | 'amt';

export interface ParamBenchmark {
  band: BenchBand;
  unit: BenchUnit;
  /** i18n key for the "why" tooltip, resolved in the frontend dict. */
  whyKey: string;
  /** Present when a regulatory ceiling caps `band.max`; drives the 🔴 "exceeds cap" state + a note. */
  cap?: { max: number; noteKey: string };
}

/** Value position relative to a band/cap — drives the coloured chip. */
export type BandState = 'below' | 'on' | 'above' | 'over_cap';

// ── Welcome wager (wW) — the geo-dependent parameter ──────────────────────────
// Keyed by license first (regulatory / country regimes), region as fallback.
const WELCOME_WAGER_BY_LICENSE: Record<string, BenchBand> = {
  ukgc:      { min: 1,  rec: 5,  max: 10 }, // ⚖️ UKGC legal cap 10x (19.01.2026)
  dga:       { min: 1,  rec: 8,  max: 10 }, // ⚖️ DK legal cap 10x + DKK 1000
  bets_br:   { min: 20, rec: 35, max: 45 }, // 🚫 welcome prohibited in regulated BR — band applies to offshore/grey only; warning shown separately
  segob:     { min: 20, rec: 35, max: 45 }, // MX — SEGOB, 35x market avg
  coljuegos: { min: 20, rec: 30, max: 40 }, // CO — Coljuegos, restrictive (1.6% GGR volume cap)
  mincetur:  { min: 20, rec: 35, max: 45 }, // PE — MINCETUR, 35x avg
};
const WELCOME_WAGER_BY_REGION: Record<string, BenchBand> = {
  eu:     { min: 20, rec: 35, max: 45 }, // MGA market practice (35x typical, 20–50x)
  cis:    { min: 25, rec: 35, max: 45 }, // Russia/KZ: 35x typical
  crypto: { min: 25, rec: 40, max: 50 }, // industry avg 35–40x, >50x punishing
  latam:  { min: 25, rec: 40, max: 50 }, // offshore Curaçao base (AR/CL grey market)
  mn:     { min: 25, rec: 35, max: 45 },
  sweep:  { min: 1,  rec: 1,  max: 5  }, // US sweeps: ~1x playthrough
};

// ── Geo-independent market-norm bands ─────────────────────────────────────────
const GLOBAL: Record<string, ParamBenchmark> = {
  // Welcome match % — 100% is the universal standard; >200% = aggressive.
  w_pct:     { band: { min: 50,  rec: 100, max: 200 }, unit: '%',   whyKey: 'bench_why_w_pct' },
  // Reload wager — sits below welcome (~5x lower); retention audience.
  rl_wager:  { band: { min: 20,  rec: 30,  max: 40  }, unit: 'x',   whyKey: 'bench_why_rl_wager' },
  // Reload match % — lower than welcome, 25–75%.
  rl_pct:    { band: { min: 25,  rec: 50,  max: 75  }, unit: '%',   whyKey: 'bench_why_rl_pct' },
  // NDB wager — high (free money) but players ignore >35x; rec adjusted down to 35.
  ndb_wager: { band: { min: 30,  rec: 35,  max: 50  }, unit: 'x',   whyKey: 'bench_why_ndb_wager' },
  // NOTE: NDB amount ($) is deliberately NOT benchmarked — its band would be USD but the field
  // shows local currency, so a chip would misclassify. Only currency-independent params (wager, %)
  // are safe to chip; keep it that way if adding params here.
};

// Regulatory wager ceiling per license (UK/DK 10× applies to ALL bonus types). This is the
// SINGLE SOURCE OF TRUTH for the cap — `buildConfig` imports it too so the generated wager
// values and the UI benchmark bands agree (no frontend-only enforcement).
export const LICENSE_WAGER_CAP: Record<string, number> = {
  ukgc: 10, // ⚖️ UKGC, effective 19.01.2026
  dga:  10, // ⚖️ Denmark (DGA) legal ceiling
};
const WAGER_CAP_NOTE: Record<string, string> = { ukgc: 'reg_note_ukgc', dga: 'reg_note_dga' };
// Params whose wager is regulatorily capped alongside welcome (UK/DK 10x sweeps all bonuses).
const WAGER_CAPPED_PARAMS = new Set(['w_wager', 'rl_wager', 'ndb_wager']);

/**
 * Resolve the benchmark for a parameter given the caller's region + license.
 * Returns null when no benchmark applies (e.g. max-bonus is deposit-relative — tooltip only).
 */
export function getBenchmark(param: string, region: string, license: string): ParamBenchmark | null {
  let result: ParamBenchmark | null = null;

  if (param === 'w_wager') {
    const band = WELCOME_WAGER_BY_LICENSE[license] || WELCOME_WAGER_BY_REGION[region] || null;
    if (band) result = { band: { ...band }, unit: 'x', whyKey: 'bench_why_w_wager' };
  } else if (GLOBAL[param]) {
    const g = GLOBAL[param];
    result = { band: { ...g.band }, unit: g.unit, whyKey: g.whyKey };
  }

  if (!result) return null;

  // Apply regulatory wager cap (UK/DK 10x across all bonus types). Always attach the
  // cap when the license has one — even if the band already sits at the ceiling — so the
  // UI shows a ⚖️ legal-cap state (and "exceeds cap" above it), not a soft "above range".
  if (WAGER_CAPPED_PARAMS.has(param)) {
    const capMax = LICENSE_WAGER_CAP[license];
    if (capMax != null) {
      result.cap = { max: capMax, noteKey: WAGER_CAP_NOTE[license] };
      result.band = {
        min: Math.min(result.band.min, capMax),
        rec: Math.min(result.band.rec, capMax),
        max: Math.min(result.band.max, capMax),
      };
    }
  }
  return result;
}

/** Classify a value against a benchmark → chip state. */
export function classifyValue(value: number, bench: ParamBenchmark): BandState {
  if (bench.cap && value > bench.cap.max) return 'over_cap';
  if (value < bench.band.min) return 'below';
  if (value > bench.band.max) return 'above';
  return 'on';
}

/**
 * Regulatory note for a mechanic under a license (for banners).
 * Returns an i18n key or null.
 */
export function regulatoryNote(license: string, mechanic: string): string | null {
  if (license === 'bets_br') {
    if (mechanic === 'welcome') return 'reg_warn_br_welcome'; // hard: prohibited
    if (mechanic === 'ndb' || mechanic === 'reload') return 'reg_warn_br_soft'; // soft: check local
    return null;
  }
  if (license === 'ukgc') return 'reg_note_ukgc';
  if (license === 'dga') return 'reg_note_dga';
  if (license === 'coljuegos') return 'reg_note_coljuegos';
  return null;
}
