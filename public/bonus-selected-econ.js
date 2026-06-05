// Client-side port of src/domain/bonus/selectedEcon.ts
// Keep in sync — parity asserted in tests/domain/bonus.selectedEcon.parity.test.js

const CHAIN_PROGRESSION = { dep2: 0.45, dep3: 0.25 };

const SV = 0.10;
const NDB_UPTAKE    = 0.40;
const RELOAD_UPTAKE = 0.10;
const CB_CLAIM_RATE = 0.30;
const DEP2_COHORT = CHAIN_PROGRESSION.dep2;
const DEP3_COHORT = CHAIN_PROGRESSION.dep3;

const SCENARIOS = [
  { key: 'sP10', conv: 0.10, dWCR: -0.02, dRTP: -0.005, cbScale: 0.5 },
  { key: 'sP50', conv: 0.20, dWCR:  0.00, dRTP:  0.000, cbScale: 1.0 },
  { key: 'sP90', conv: 0.40, dWCR: +0.02, dRTP: +0.003, cbScale: 1.6 },
];

function _erf(x) {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
function _phi(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
function _Phi(z) { return 0.5 * (1 + _erf(z / Math.SQRT2)); }
function _truncNormalPayout(B, W, adjWCR, adjRTP) {
  if (B <= 0 || W <= 0) return 0;
  const be    = adjWCR / (1 - adjRTP);
  const mu    = B * (1 - W / be);
  const sigma = Math.sqrt(W * B / adjWCR);
  const z     = mu / sigma;
  return Math.max(0, mu * _Phi(z) + sigma * _phi(z));
}

function _num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : (fallback || 0);
}

function _scenarioPayout(bSize, wx, mixedWCR, mixedRTP, dWCR, dRTP) {
  if (bSize <= 0 || wx <= 0) return 0;
  const adjWCR = Math.max(0.01, mixedWCR + dWCR);
  const adjRTP = Math.min(0.999, Math.max(0.5, mixedRTP + dRTP));
  const payoutStat = _truncNormalPayout(bSize, wx, adjWCR, adjRTP);
  const adjBe  = adjWCR / (1 - adjRTP);
  const adjEff = wx > 0 ? Math.min(1, adjBe / Math.max(adjBe, wx)) : 1;
  return payoutStat > bSize * 1e-6 ? payoutStat : bSize * adjEff;
}

export function computeSelectedEcon(cfg, selectedTypes) {
  const econ      = cfg.econ || {};
  const dep       = _num(cfg.dep, 100);
  const pl        = _num(cfg.pl, 5000);
  const mixedWCR  = _num(econ.mixedWCR, 0.55);
  const mixedRTP  = _num(econ.mixedRTP, 0.96);
  const wagerX    = _num(econ.wagerX, 0);
  const bonusSize = _num(econ.bonusSize, 0);

  const wager = cfg.wager || {};
  const wN    = _num(wager.wN, 50);
  const wR    = _num(wager.wR, 30);

  const ndb = cfg.ndb || {};
  const ndbType = String(ndb.type || '');
  const ndbAmt  = _num(ndb.amt);
  const ndbFs   = _num(ndb.fs);
  const ndbSize = ndbType === 'daily' ? 0
    : ndbType === 'combined'      ? ndbAmt + ndbFs * SV
    : ndbType === 'fs_restricted' ? ndbFs * SV
    : ndbAmt;

  const dep2 = cfg.dep2 || {};
  const d2IsChain = String(dep2.type || '') !== 'sc_purchase';
  const d2MaxB = d2IsChain ? _num(dep2.maxB) : 0;
  const bSizeD2 = d2IsChain && d2MaxB > 0
    ? Math.min(dep * _num(dep2.pct, 75) / 100, d2MaxB) + _num(dep2.fs) * SV : 0;
  const d2WagerX = d2IsChain ? _num(dep2.wager, wagerX) : 0;

  const dep3 = cfg.dep3 || {};
  const d3IsChain = String(dep3.type || '') !== 'sc_purchase';
  const d3MaxB = d3IsChain ? _num(dep3.maxB) : 0;
  const bSizeD3 = d3IsChain && d3MaxB > 0
    ? Math.min(dep * _num(dep3.pct, 50) / 100, d3MaxB) + _num(dep3.fs) * SV : 0;
  const d3WagerX = d3IsChain ? _num(dep3.wager, wagerX) : 0;

  const reload = cfg.reload || {};
  const rlPct  = _num(reload.pct);
  const rlMaxB = _num(reload.maxB);
  const rlBase = rlPct ? Math.min(dep * (rlPct / 100), rlMaxB || dep) + _num(reload.fs) * SV : 0;

  const cashback = cfg.cashback || {};
  // pct may be a number (flat model) or a "5%" string (tier model)
  const _pct = (v) => { const n = parseFloat(String(v)); return Number.isFinite(n) ? n : 0; };
  const cbPctRaw = String(cashback.model || '') === 'tier'
    ? Math.max(0, ...((cashback.tiers || []).map(t => _pct(t.pct))))
    : _pct(cashback.pct);
  const cbPct = cbPctRaw / 100;
  const expMonthlyLoss = dep * Math.max(0, 1 - mixedRTP);

  const SPECS = {
    welcome:  { key: 'welcome',  bSize: bonusSize, wx: wagerX,   cohort: conv => conv },
    ndb:      { key: 'ndb',      bSize: ndbSize,   wx: wN,       cohort: () => NDB_UPTAKE },
    dep2:     { key: 'dep2',     bSize: bSizeD2,   wx: d2WagerX, cohort: conv => conv * DEP2_COHORT },
    dep3:     { key: 'dep3',     bSize: bSizeD3,   wx: d3WagerX, cohort: conv => conv * DEP3_COHORT },
    reload:   { key: 'reload',   bSize: rlBase,    wx: wR,       cohort: () => RELOAD_UPTAKE },
    cashback: { key: 'cashback', bSize: 0,         wx: 0,        cohort: () => CB_CLAIM_RATE,
                cashback: { pct: cbPct, expMonthlyLoss } },
  };

  const selected = (selectedTypes || []).filter(t => SPECS[t]);
  const breakdown = [];
  const totals = { sP10: 0, sP50: 0, sP90: 0 };

  for (const t of selected) {
    const spec = SPECS[t];
    const row = { key: t, sP10: 0, sP50: 0, sP90: 0 };
    for (const s of SCENARIOS) {
      let cost;
      if (spec.cashback) {
        cost = Math.round(spec.cashback.pct * spec.cashback.expMonthlyLoss * CB_CLAIM_RATE * s.cbScale * pl);
      } else {
        const payout = _scenarioPayout(spec.bSize, spec.wx, mixedWCR, mixedRTP, s.dWCR, s.dRTP);
        cost = Math.round(payout * spec.cohort(s.conv) * pl);
      }
      row[s.key] = cost;
      totals[s.key] += cost;
    }
    breakdown.push(row);
  }

  let maxRisk = 0;
  for (const t of selected) {
    const spec = SPECS[t];
    if (spec.cashback) {
      maxRisk += Math.round(spec.cashback.pct * spec.cashback.expMonthlyLoss * CB_CLAIM_RATE * 1.6 * pl);
    } else {
      maxRisk += Math.round(spec.bSize * spec.cohort(0.40) * pl);
    }
  }

  const denom = pl * dep;
  const costRatio = denom > 0 ? totals.sP50 / denom : 0;

  return {
    sP10: { conv: 0.10, cost: totals.sP10 },
    sP50: { conv: 0.20, cost: totals.sP50 },
    sP90: { conv: 0.40, cost: totals.sP90 },
    costRatio: +costRatio.toFixed(3),
    maxRisk,
    breakdown,
    selectedTypes: selected,
  };
}

if (typeof window !== 'undefined') {
  window._bonusSelectedEcon = { computeSelectedEcon };
}
