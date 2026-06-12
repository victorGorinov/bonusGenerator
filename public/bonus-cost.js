// Client-side port of bonus domain cost functions.
// Keep in sync with src/domain/bonus/{payout,recalcCosts}.ts

const CHAIN_PROGRESSION = { dep2: 0.45, dep3: 0.25 };

// ── Payout math (port of payout.ts) ─────────────────────────────────────────

function _erf(x) {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

function _phi(z) {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

function _Phi(z) {
  return 0.5 * (1 + _erf(z / Math.SQRT2));
}

function _truncNormalPayout(B, W, adjWCR, adjRTP) {
  if (B <= 0 || W <= 0) return 0;
  const be    = adjWCR / (1 - adjRTP);
  const mu    = B * (1 - W / be);
  const sigma = Math.sqrt(W * B / adjWCR);
  const z     = mu / sigma;
  return Math.max(0, mu * _Phi(z) + sigma * _phi(z));
}

// ── recalcCostsLocal (port of recalcCosts.ts) ────────────────────────────────
//
// Overrides use the same key names as the DOM override inputs (_OV_IDS):
//   ov_w_wager, ov_w_pct, ov_w_maxB, ov_w_fs, ov_w_days
//   ov_rl_wager, ov_rl_maxB, ov_rl_pct, ov_rl_fs
//   ov_d2_wager, ov_d2_maxB, ov_d2_pct, ov_d2_fs
//   ov_d3_wager, ov_d3_maxB, ov_d3_pct, ov_d3_fs
//   ov_ndb_wager, ov_ndb_fs, ov_ndb_amt
//   ov_fs_wager, ov_fs_count

export function recalcCostsLocal(cfg, overrides) {
  const econ    = cfg.econ    || {};
  const dep     = cfg.dep     || 0;
  const pl      = cfg.pl      || 0;
  const ndb     = cfg.ndb     || {};
  const fsSpec  = cfg.fsSpec  || null;
  const wager   = cfg.wager   || {};
  const reload  = cfg.reload  || {};
  const dep2    = cfg.dep2    || {};
  const dep3    = cfg.dep3    || {};
  const welcome = cfg.welcome || {};
  const ov      = overrides || {};

  const gv = (key, def) => {
    if (!(key in ov)) return def;
    const v = parseFloat(String(ov[key]));
    return (isNaN(v) || v < 0) ? def : v;
  };

  const spinV = fsSpec ? fsSpec.val : 0.10;

  const elig = (minD) =>
    minD <= 0 || minD <= dep ? 1.0 : Math.min(1.0, Math.max(0.1, dep / minD));

  function svCost(bonusSize, wagerX, conv, dWCR, dRTP, maxWin = 0, minD = 0) {
    if (bonusSize <= 0 || wagerX <= 0) return 0;
    const adjWCR = Math.max(0.01, (econ.mixedWCR || 0) + (dWCR || 0));
    const adjRTP = Math.min(0.999, Math.max(0.5, (econ.mixedRTP || 0.96) + (dRTP || 0)));
    const rawPayout = _truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP);
    // Payout fallback for large-denomination currencies (MNT/RUB/KZT): truncNormalPayout
    // underflows to ~1e-200 when wagerX >> breakeven, making Math.round() return 0.
    const adjBe  = adjWCR / (1 - adjRTP);
    const adjEff = wagerX > 0 ? Math.min(1, adjBe / Math.max(adjBe, wagerX)) : 1;
    const payoutFinal = rawPayout > bonusSize * 1e-6 ? rawPayout : bonusSize * adjEff;
    const payout = (maxWin > 0) ? Math.min(payoutFinal, maxWin) : payoutFinal;
    return Math.round(payout * conv * elig(minD) * pl);
  }

  const w_pct    = gv('ov_w_pct',    welcome.pct  || 100);
  const w_wager  = gv('ov_w_wager',  econ.wagerX  || 30);
  const w_maxB   = gv('ov_w_maxB',   welcome.maxB || 0);
  const w_fs     = gv('ov_w_fs',     welcome.fs   || 0);
  const w_minD   = gv('ov_w_minD',   welcome.minD || 0);
  const w_maxWin = gv('ov_w_maxWin', 0);
  const w_bonus  = Math.min(dep * w_pct / 100, w_maxB) + w_fs * spinV;
  const c_w_p10  = svCost(w_bonus, w_wager, 0.10, -0.02, -0.005, w_maxWin, w_minD);
  const c_w_p50  = svCost(w_bonus, w_wager, 0.20,  0,     0,     w_maxWin, w_minD);
  const c_w_p90  = svCost(w_bonus, w_wager, 0.40, +0.02, +0.003, w_maxWin, w_minD);

  const ndb_wager  = gv('ov_ndb_wager',  ndb.wager || 50);
  const ndb_maxWin = gv('ov_ndb_maxWin', 0);
  let ndb_size = 0;
  const ndbType = ndb.type;
  if      (ndbType === 'fs_restricted') ndb_size = gv('ov_ndb_fs',  ndb.fs  || 10) * spinV;
  else if (ndbType === 'crypto')        ndb_size = gv('ov_ndb_amt', ndb.amt || 0);
  else if (ndbType === 'combined')      ndb_size = gv('ov_ndb_amt', ndb.amt || 0) + gv('ov_ndb_fs', ndb.fs || 0) * spinV;
  else if (ndb.amt)                     ndb_size = ndbType === 'fs' ? gv('ov_ndb_fs', ndb.amt || 0) * spinV : gv('ov_ndb_amt', ndb.amt || 0);
  const c_ndb = svCost(ndb_size, ndb_wager, 0.20, 0, 0, ndb_maxWin);

  const rl_pct    = gv('ov_rl_pct',    reload.pct  || 50);
  const rl_wager  = gv('ov_rl_wager',  wager.wR    || 35);
  const rl_maxB   = gv('ov_rl_maxB',   reload.maxB || 0);
  const rl_fs     = gv('ov_rl_fs',     reload.fs   || 0);
  const rl_minD   = gv('ov_rl_minD',   reload.minD || 0);
  const rl_maxWin = gv('ov_rl_maxWin', 0);
  const rl_bonus  = Math.min(dep * rl_pct / 100, rl_maxB) + rl_fs * spinV;
  const c_rl      = svCost(rl_bonus, rl_wager, 0.20, 0, 0, rl_maxWin, rl_minD);

  const d2_pct    = gv('ov_d2_pct',    dep2.pct   || 75);
  const d2_wager  = gv('ov_d2_wager',  dep2.wager || econ.wagerX || 30);
  const d2_maxB   = gv('ov_d2_maxB',   dep2.maxB  || 0);
  const d2_fs     = gv('ov_d2_fs',     dep2.fs    || 0);
  const d2_minD   = gv('ov_d2_minD',   dep2.minD  || 0);
  const d2_maxWin = gv('ov_d2_maxWin', 0);
  const d2_bonus  = Math.min(dep * d2_pct / 100, d2_maxB) + d2_fs * spinV;
  const c_d2      = svCost(d2_bonus, d2_wager, 0.20 * CHAIN_PROGRESSION.dep2, 0, 0, d2_maxWin, d2_minD);

  const d3_pct    = gv('ov_d3_pct',    dep3.pct   || 50);
  const d3_wager  = gv('ov_d3_wager',  dep3.wager || econ.wagerX || 30);
  const d3_maxB   = gv('ov_d3_maxB',   dep3.maxB  || 0);
  const d3_fs     = gv('ov_d3_fs',     dep3.fs    || 0);
  const d3_minD   = gv('ov_d3_minD',   dep3.minD  || 0);
  const d3_maxWin = gv('ov_d3_maxWin', 0);
  const d3_bonus  = Math.min(dep * d3_pct / 100, d3_maxB) + d3_fs * spinV;
  const c_d3      = svCost(d3_bonus, d3_wager, 0.20 * CHAIN_PROGRESSION.dep3, 0, 0, d3_maxWin, d3_minD);

  const fs_wager  = gv('ov_fs_wager',  fsSpec ? fsSpec.wager : 30);
  const fs_count  = gv('ov_fs_count',  fsSpec ? fsSpec.count : 0);
  const fs_maxWin = gv('ov_fs_maxWin', 0);
  const fs_bonus  = fsSpec ? fs_count * fsSpec.val : 0;
  const c_fs      = svCost(fs_bonus, fs_wager, 0.20, 0, 0, fs_maxWin);

  const total = c_w_p50 + c_ndb + c_rl + c_d2 + c_d3 + c_fs;
  return {
    costs:   { w_p10: c_w_p10, w_p50: c_w_p50, w_p90: c_w_p90, ndb: c_ndb, rl: c_rl, d2: c_d2, d3: c_d3, fs: c_fs, total },
    ratio:   (pl * dep) > 0 ? c_w_p50 / (pl * dep) : 0,
    maxRisk: Math.round(pl * w_bonus),
  };
}

// ── _calcRetentionV2Local ────────────────────────────────────────────────────
// Clone of _calcRetentionV2 from app.js, but accepts explicit solver overrides
// instead of reading DOM state.
//
// opts: { wager?, matchPct?, addFS?, addCashback?, addReload?, segment?, plat? }

function _calcRetentionV2Local(cfg, opts) {
  const E   = cfg.econ     || {};
  const W   = cfg.welcome  || {};
  const N   = cfg.ndb      || {};
  const RL  = cfg.reload   || {};
  const D2  = cfg.dep2     || {};
  const FS  = cfg.fsSpec   || null;
  const CB  = cfg.cashback || {};
  const o   = opts || {};

  const seg  = o.segment || 'mid';
  const plat = o.plat    || 'both';

  const SEG_LIFT = { new: 0.25, mid: 0.18, vip: 0.12 };
  const base = SEG_LIFT[seg] || 0.10;

  const wagerX    = (o.wager > 0 ? o.wager : null) || E.wagerX || 30;
  const beW       = E.breakeven_wager || wagerX;
  const wagScore  = Math.min(2.0, Math.max(0.3, beW / Math.max(wagerX, 1)));
  const wagFactor = Math.min(1.35, Math.max(0.65, 0.7 + 0.3 * wagScore));

  const matchPct  = o.matchPct != null ? o.matchPct : (W.pct || 100);
  const genFactor = Math.min(1.15, Math.max(0.85, 0.85 + 0.30 * Math.min(matchPct / 100, 1.0)));

  const hasNDB    = (N.amt > 0) || (N.fs > 0);
  const hasReload = o.addReload != null ? Boolean(o.addReload) : ((RL.pct || 0) > 0);
  const hasDep2   = (D2.pct || 0) > 0;
  const hasFS     = o.addFS != null ? Boolean(o.addFS) : (FS != null && (FS.count || 0) > 20);
  const hasCB     = o.addCashback != null ? Boolean(o.addCashback) : ((CB.pct >= 5) || CB.model === 'tier');

  const mechFactor = 1.0
    + (hasNDB    ? 0.06 : 0)
    + (hasReload ? 0.08 : 0)
    + (hasDep2   ? 0.04 : 0)
    + (hasFS     ? 0.04 : 0)
    + (hasCB     ? 0.07 : 0);

  const rtp       = E.mixedRTP || 0.96;
  const rtpFactor = Math.min(1.06, Math.max(0.94, 0.94 + 0.12 * ((rtp - 0.85) / 0.14)));

  const platFactor = { mobile: 1.05, desk: 0.97, both: 1.0 }[plat] || 1.0;

  const lift = Math.min(0.40, base * wagFactor * genFactor * mechFactor * rtpFactor * platFactor);
  return { lift, wagerX, beW, matchPct, hasNDB, hasReload, hasDep2, hasFS, hasCB };
}

// ── recalcBonusEconLocal ─────────────────────────────────────────────────────
// Combined cost + lift → econ metrics, used by the balance solver.
//
// solverDraft: { wager?, matchPct?, addFS?, addCashback?, addReload?, segment?, plat? }
// returns: { lift, incrRev, campCost, netIncr, roi, costs }

export function recalcBonusEconLocal(cfg, solverDraft) {
  const E = cfg.econ || {};
  const d = solverDraft || {};

  // Translate solver flags to DOM-style cost overrides
  const costOverrides = {};
  if (d.wager    != null)          costOverrides['ov_w_wager'] = d.wager;
  if (d.matchPct != null)          costOverrides['ov_w_pct']   = d.matchPct;
  if (d.addFS    === false)        { costOverrides['ov_w_fs'] = 0; costOverrides['ov_fs_count'] = 0; }
  if (d.addReload === false)       costOverrides['ov_rl_pct']  = 0;

  const { costs, ratio } = recalcCostsLocal(cfg, costOverrides);

  const v = _calcRetentionV2Local(cfg, d);

  const pl       = E.pl   || 1;
  const ltv3     = E.ltv3 || 0;
  const arpu     = E.arpu || 0;
  const incrPl   = Math.round(pl * v.lift);
  const incrRev  = Math.round(incrPl * ltv3);
  const campCost = Math.round(3 * ratio * pl * arpu);
  const netIncr  = incrRev - campCost;
  const roi      = campCost > 0 ? incrRev / campCost : 0;

  return { lift: v.lift, incrRev, campCost, netIncr, roi, costs };
}

// ── Regulatory license caps ──────────────────────────────────────────────────
// Wager and max-bonus caps derived from geo/eu.ts license overrides.
// Mirrors: EU.licenses.{ukgc,dga}.wager.wW and welcome.maxBMax
//
// For licenses without explicit caps ('none', 'mga'), a sanity ceiling is applied
// (wager 50×, bonus Infinity) to prevent the solver from producing absurd output.

const _LICENSE_WAGER_CAP = {
  ukgc: 10,
  dga:  25,
  mga:  50,   // no statutory cap; use sanity ceiling
  none: 50,
};

const _LICENSE_MAX_BONUS = {
  ukgc: 200,
  dga:  1000,
  mga:  Infinity,
  none: Infinity,
};

export function getLicenseWagerCap(lic) {
  return _LICENSE_WAGER_CAP[lic] ?? 50;
}

export function getLicenseMaxBonus(lic) {
  return _LICENSE_MAX_BONUS[lic] ?? Infinity;
}

/**
 * Builds regulatory constraint array for a given cfg.
 * Constraints are passed to solveToTarget({ constraints, cfg }).
 *
 * draft keys checked: wager (F1 lever)
 * cfg  keys checked:  cfg.welcome.maxB (bonus size from config)
 */
export function buildRegConstraints(cfg) {
  const lic      = (cfg && cfg.lic)  || 'none';
  const wagerCap = getLicenseWagerCap(lic);
  const bonusCap = getLicenseMaxBonus(lic);

  const constraints = [
    // Wager cap: solver lever 'wager' must not exceed license maximum
    { check: (d) => (d.wager == null || d.wager <= wagerCap) },
  ];

  // Bonus size cap: only meaningful for finite caps (UKGC/DGA)
  if (isFinite(bonusCap)) {
    constraints.push({
      // welcome.maxB is set by buildConfig and doesn't change via solver levers,
      // but we guard anyway so the constraint array is complete.
      check: (_d, ctx) => {
        const maxB = ctx && ctx.welcome && ctx.welcome.maxB;
        return maxB == null || maxB <= bonusCap;
      },
    });
  }

  return constraints;
}

// ── parseRecTarget ───────────────────────────────────────────────────────────
// Maps an AI optimize recommendation (param + target string) to DOM override
// id/value pairs that can be written to the configurator's override inputs.
//
// Returns { [overId]: value } — empty object when the param cannot be mapped.

export function parseRecTarget(param, target) {
  const num      = parseFloat(target);
  const boolVal  = String(target).toLowerCase();
  const isFalsy  = boolVal === 'false' || boolVal === '0' || boolVal === 'no';
  switch (param) {
    case 'wager':
      return isNaN(num) ? {} : { 'ov_w_wager': num };
    case 'matchPct':
      return isNaN(num) ? {} : { 'ov_w_pct': num };
    case 'addFS':
      return isFalsy ? { 'ov_w_fs': 0, 'ov_fs_count': 0 } : {};
    case 'addReload':
      return isFalsy ? { 'ov_rl_pct': 0 } : {};
    case 'addDep2':
      return isFalsy ? { 'ov_d2_pct': 0 } : {};
    default:
      return {};
  }
}

// Expose to global scope for non-module scripts
if (typeof window !== 'undefined') {
  window._bonusCost = { recalcCostsLocal, recalcBonusEconLocal, buildRegConstraints, getLicenseWagerCap, getLicenseMaxBonus, parseRecTarget };
}
