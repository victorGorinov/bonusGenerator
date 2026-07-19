// Client mirror of src/config/benchmarks/bonusBenchmarks.ts — MUST stay in parity.
// Parity test: tests/domain/bonus.benchmarks.parity.test.js.
// Consumed in the browser via window.RetomatBenchmarks (configurator.js is a classic script);
// also ESM-exported so the parity test can import it directly.

const WELCOME_WAGER_BY_LICENSE = {
  ukgc:      { min: 1,  rec: 5,  max: 10 },
  dga:       { min: 1,  rec: 8,  max: 10 },
  bets_br:   { min: 20, rec: 35, max: 45 },
  segob:     { min: 20, rec: 35, max: 45 },
  coljuegos: { min: 20, rec: 30, max: 40 },
  mincetur:  { min: 20, rec: 35, max: 45 },
};
const WELCOME_WAGER_BY_REGION = {
  eu:     { min: 20, rec: 35, max: 45 },
  cis:    { min: 25, rec: 35, max: 45 },
  crypto: { min: 25, rec: 40, max: 50 },
  latam:  { min: 25, rec: 40, max: 50 },
  mn:     { min: 25, rec: 35, max: 45 },
  sweep:  { min: 1,  rec: 1,  max: 5  },
};
const GLOBAL = {
  w_pct:     { band: { min: 50,  rec: 100, max: 200 }, unit: '%',   whyKey: 'bench_why_w_pct' },
  rl_wager:  { band: { min: 20,  rec: 30,  max: 40  }, unit: 'x',   whyKey: 'bench_why_rl_wager' },
  rl_pct:    { band: { min: 25,  rec: 50,  max: 75  }, unit: '%',   whyKey: 'bench_why_rl_pct' },
  ndb_wager: { band: { min: 30,  rec: 35,  max: 50  }, unit: 'x',   whyKey: 'bench_why_ndb_wager' },
  // ndb_amt intentionally omitted — currency-denominated, not safe to chip (see .ts source).
};
const WAGER_CAPPED_PARAMS = { w_wager: 1, rl_wager: 1, ndb_wager: 1 };
const WAGER_CAP_BY_LICENSE = {
  ukgc: { max: 10, noteKey: 'reg_note_ukgc' },
  dga:  { max: 10, noteKey: 'reg_note_dga' },
};

export function getBenchmark(param, region, license) {
  let result = null;
  if (param === 'w_wager') {
    const band = WELCOME_WAGER_BY_LICENSE[license] || WELCOME_WAGER_BY_REGION[region] || null;
    if (band) result = { band: { min: band.min, rec: band.rec, max: band.max }, unit: 'x', whyKey: 'bench_why_w_wager' };
  } else if (GLOBAL[param]) {
    const g = GLOBAL[param];
    result = { band: { min: g.band.min, rec: g.band.rec, max: g.band.max }, unit: g.unit, whyKey: g.whyKey };
  }
  if (!result) return null;

  if (WAGER_CAPPED_PARAMS[param]) {
    const cap = WAGER_CAP_BY_LICENSE[license];
    if (cap) {
      result.cap = { max: cap.max, noteKey: cap.noteKey };
      result.band = {
        min: Math.min(result.band.min, cap.max),
        rec: Math.min(result.band.rec, cap.max),
        max: Math.min(result.band.max, cap.max),
      };
    }
  }
  return result;
}

export function classifyValue(value, bench) {
  if (bench.cap && value > bench.cap.max) return 'over_cap';
  if (value < bench.band.min) return 'below';
  if (value > bench.band.max) return 'above';
  return 'on';
}

export function regulatoryNote(license, mechanic) {
  if (license === 'bets_br') {
    if (mechanic === 'welcome') return 'reg_warn_br_welcome';
    if (mechanic === 'ndb' || mechanic === 'reload') return 'reg_warn_br_soft';
    return null;
  }
  if (license === 'ukgc') return 'reg_note_ukgc';
  if (license === 'dga') return 'reg_note_dga';
  if (license === 'coljuegos') return 'reg_note_coljuegos';
  return null;
}

// Expose to global scope for non-module scripts (configurator.js).
if (typeof window !== 'undefined') {
  window.RetomatBenchmarks = { getBenchmark, classifyValue, regulatoryNote };
}
