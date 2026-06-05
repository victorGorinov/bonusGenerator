import { truncNormalPayout } from './payout.js';
import { CHAIN_PROGRESSION }  from './chainModel.js';

// ── Calibration constants (confirmed 2026-06-03) ─────────────────────────────
// Free-spin → cash value factor (same as buildConfig _sv).
const SV = 0.10;
// Flat participation cohorts (fraction of player base).
const NDB_UPTAKE    = 0.40;  // share of players claiming no-deposit bonus
const RELOAD_UPTAKE = 0.10;  // monthly share taking a reload
const CB_CLAIM_RATE = 0.30;  // share of net-losing players claiming cashback
// dep2/dep3 cohorts are conv-scaled fractions of the welcome (acquisition) cohort.
const DEP2_COHORT = CHAIN_PROGRESSION.dep2; // 0.45
const DEP3_COHORT = CHAIN_PROGRESSION.dep3; // 0.25

// Three forecast scenarios: P10 (cautious) / P50 (expected) / P90 (generous).
interface ScenarioDef { key: 'sP10' | 'sP50' | 'sP90'; conv: number; dWCR: number; dRTP: number; cbScale: number; }
const SCENARIOS: ScenarioDef[] = [
  { key: 'sP10', conv: 0.10, dWCR: -0.02, dRTP: -0.005, cbScale: 0.5 },
  { key: 'sP50', conv: 0.20, dWCR:  0.00, dRTP:  0.000, cbScale: 1.0 },
  { key: 'sP90', conv: 0.40, dWCR: +0.02, dRTP: +0.003, cbScale: 1.6 },
];

export interface SelectedScenario { conv: number; cost: number; }
export interface SelectedEcon {
  sP10: SelectedScenario;
  sP50: SelectedScenario;
  sP90: SelectedScenario;
  costRatio: number;
  maxRisk: number;
  breakdown: Array<{ key: string; sP10: number; sP50: number; sP90: number }>;
  selectedTypes: string[];
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Expected payout for a single bonus under a scenario, with the same
// large-denomination fallback used in buildConfig.calcScenario.
function scenarioPayout(bSize: number, wx: number, mixedWCR: number, mixedRTP: number, dWCR: number, dRTP: number): number {
  if (bSize <= 0 || wx <= 0) return 0;
  const adjWCR = Math.max(0.01, mixedWCR + dWCR);
  const adjRTP = Math.min(0.999, Math.max(0.5, mixedRTP + dRTP));
  const payoutStat = truncNormalPayout(bSize, wx, adjWCR, adjRTP);
  const adjBe  = adjWCR / (1 - adjRTP);
  const adjEff = wx > 0 ? Math.min(1, adjBe / Math.max(adjBe, wx)) : 1;
  return payoutStat > bSize * 1e-6 ? payoutStat : bSize * adjEff;
}

interface MechSpec {
  key: string;
  bSize: number;
  wx: number;
  // cohort as a function of scenario conv (welcome/dep chain scale with conv; flat ones ignore it)
  cohort: (conv: number) => number;
  // cashback uses a bespoke loss-based cost instead of a wager payout
  cashback?: { pct: number; expMonthlyLoss: number };
}

/**
 * Aggregate per-mechanic expected cost across the selected bonus set.
 * `cfg` is the full buildConfig output; `selectedTypes` the user-chosen bonuses.
 * Pure — no side effects. Mirrors buildConfig cost primitives so removing or
 * adding any bonus changes sP10/sP50/sP90, costRatio and maxRisk.
 */
export function computeSelectedEcon(cfg: Record<string, unknown>, selectedTypes: string[]): SelectedEcon {
  const econ = (cfg['econ'] as Record<string, unknown>) ?? {};
  const dep      = num(cfg['dep'], 100);
  const pl       = num(cfg['pl'], 5000);
  const mixedWCR = num(econ['mixedWCR'], 0.55);
  const mixedRTP = num(econ['mixedRTP'], 0.96);
  const wagerX   = num(econ['wagerX'], 0);
  const bonusSize = num(econ['bonusSize'], 0);

  const wager  = (cfg['wager'] as Record<string, unknown>) ?? {};
  const wN     = num(wager['wN'], 50);
  const wR     = num(wager['wR'], 30);

  // ── Per-mechanic bonus sizes (replicate buildConfig) ──
  const ndb = (cfg['ndb'] as Record<string, unknown>) ?? {};
  const ndbType = String(ndb['type'] ?? '');
  const ndbAmt  = num(ndb['amt']);
  const ndbFs   = num(ndb['fs']);
  const ndbSize = ndbType === 'daily' ? 0
    : ndbType === 'combined'      ? ndbAmt + ndbFs * SV
    : ndbType === 'fs_restricted' ? ndbFs * SV
    : ndbAmt;

  const dep2 = (cfg['dep2'] as Record<string, unknown>) ?? {};
  const d2IsChain = String(dep2['type'] ?? '') !== 'sc_purchase';
  const d2MaxB = d2IsChain ? num(dep2['maxB']) : 0;
  const bSizeD2 = d2IsChain && d2MaxB > 0
    ? Math.min(dep * num(dep2['pct'], 75) / 100, d2MaxB) + num(dep2['fs']) * SV : 0;
  const d2WagerX = d2IsChain ? num(dep2['wager'], wagerX) : 0;

  const dep3 = (cfg['dep3'] as Record<string, unknown>) ?? {};
  const d3IsChain = String(dep3['type'] ?? '') !== 'sc_purchase';
  const d3MaxB = d3IsChain ? num(dep3['maxB']) : 0;
  const bSizeD3 = d3IsChain && d3MaxB > 0
    ? Math.min(dep * num(dep3['pct'], 50) / 100, d3MaxB) + num(dep3['fs']) * SV : 0;
  const d3WagerX = d3IsChain ? num(dep3['wager'], wagerX) : 0;

  const reload = (cfg['reload'] as Record<string, unknown>) ?? {};
  const rlPct  = num(reload['pct']);
  const rlMaxB = num(reload['maxB']);
  const rlBase = rlPct ? Math.min(dep * (rlPct / 100), rlMaxB || dep) + num(reload['fs']) * SV : 0;

  const cashback = (cfg['cashback'] as Record<string, unknown>) ?? {};
  // pct may be a number (flat model) or a "5%" string (tier model)
  const parsePct = (v: unknown): number => { const n = parseFloat(String(v)); return Number.isFinite(n) ? n : 0; };
  const cbPctRaw = String(cashback['model'] ?? '') === 'tier'
    ? Math.max(0, ...((cashback['tiers'] as Array<Record<string, unknown>> | undefined) ?? []).map(t => parsePct(t['pct'])))
    : parsePct(cashback['pct']);
  const cbPct = cbPctRaw / 100;
  const expMonthlyLoss = dep * Math.max(0, 1 - mixedRTP);

  const SPECS: Record<string, MechSpec> = {
    welcome:  { key: 'welcome',  bSize: bonusSize, wx: wagerX,   cohort: conv => conv },
    ndb:      { key: 'ndb',      bSize: ndbSize,   wx: wN,       cohort: () => NDB_UPTAKE },
    dep2:     { key: 'dep2',     bSize: bSizeD2,   wx: d2WagerX, cohort: conv => conv * DEP2_COHORT },
    dep3:     { key: 'dep3',     bSize: bSizeD3,   wx: d3WagerX, cohort: conv => conv * DEP3_COHORT },
    reload:   { key: 'reload',   bSize: rlBase,    wx: wR,       cohort: () => RELOAD_UPTAKE },
    cashback: { key: 'cashback', bSize: 0,         wx: 0,        cohort: () => CB_CLAIM_RATE,
                cashback: { pct: cbPct, expMonthlyLoss } },
  };

  const selected = selectedTypes.filter(t => SPECS[t]);
  const breakdown: SelectedEcon['breakdown'] = [];
  const totals = { sP10: 0, sP50: 0, sP90: 0 };

  for (const t of selected) {
    const spec = SPECS[t];
    const row = { key: t, sP10: 0, sP50: 0, sP90: 0 };
    for (const s of SCENARIOS) {
      let cost: number;
      if (spec.cashback) {
        cost = Math.round(spec.cashback.pct * spec.cashback.expMonthlyLoss * CB_CLAIM_RATE * s.cbScale * pl);
      } else {
        const payout = scenarioPayout(spec.bSize, spec.wx, mixedWCR, mixedRTP, s.dWCR, s.dRTP);
        cost = Math.round(payout * spec.cohort(s.conv) * pl);
      }
      row[s.key] = cost;
      totals[s.key] += cost;
    }
    breakdown.push(row);
  }

  // Max exposure: liability at the generous (P90) cohort, full bonus size.
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
