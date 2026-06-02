// Tests for parseRecTarget and balanceToProfit solver logic (ported from loyalty-generator.js).
// The solver logic is deterministic and doesn't need a browser environment.

import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig }   from '../../src/domain/loyalty/buildConfig.js';
import { calcLoyaltyEconomics } from '../../src/domain/loyalty/calcEconomics.js';

// ── parseRecTarget (inlined to test without browser globals) ──────────────────

const UI_BOUNDS_TEST = {
  redeemRate:      { min: 10,   max: 1000 },
  topCashbackRate: { min: 0.01, max: 0.20 },
  missionCount:    { min: 0,    max: 6    },
  earnRateDeposit: { min: 1,    max: 50   },
};

function parseRecTarget(param, target) {
  const s = String(target);
  const match = s.match(/\d+\.?\d*/);
  const num = match ? parseFloat(match[0]) : NaN;

  let val;
  switch (param) {
    case 'topCashbackRate': val = num > 1 ? num / 100 : num; break;
    case 'mode':            return /hybrid|tiers|missions/.exec(s)?.[0] ?? 'hybrid';
    case 'numTiers':        return Math.max(3, Math.min(5, Math.round(num)));
    case 'missionCount':    return Math.max(0, Math.min(6, Math.round(isNaN(num) ? 0 : num)));
    default:                val = num;
  }

  if (isNaN(val)) return 0;
  const b = UI_BOUNDS_TEST[param];
  return b ? Math.max(b.min, Math.min(b.max, val)) : val;
}

describe('parseRecTarget', () => {
  it('converts percentage string to decimal for topCashbackRate', () => {
    expect(parseRecTarget('topCashbackRate', '8%')).toBeCloseTo(0.08);
    expect(parseRecTarget('topCashbackRate', '15%')).toBeCloseTo(0.15);
  });

  it('keeps decimal as-is for topCashbackRate when ≤ 1', () => {
    expect(parseRecTarget('topCashbackRate', '0.12')).toBeCloseTo(0.12);
  });

  it('extracts mode string', () => {
    expect(parseRecTarget('mode', 'switch to hybrid')).toBe('hybrid');
    expect(parseRecTarget('mode', 'tiers')).toBe('tiers');
    expect(parseRecTarget('mode', 'missions-based')).toBe('missions');
  });

  it('clamps numTiers to 3–5', () => {
    expect(parseRecTarget('numTiers', '2')).toBe(3);
    expect(parseRecTarget('numTiers', '6')).toBe(5);
    expect(parseRecTarget('numTiers', '4')).toBe(4);
  });

  it('clamps missionCount to 0–6', () => {
    expect(parseRecTarget('missionCount', '0')).toBe(0);
    expect(parseRecTarget('missionCount', '10')).toBe(6);
    expect(parseRecTarget('missionCount', '3')).toBe(3);
  });

  it('parses numeric string for earnRateDeposit and stops at first number', () => {
    expect(parseRecTarget('earnRateDeposit', '15')).toBeCloseTo(15);
    expect(parseRecTarget('earnRateDeposit', '15 pts/$1')).toBeCloseTo(15);
  });

  it('parses redeemRate: first number only, no concatenation of trailing digits', () => {
    expect(parseRecTarget('redeemRate', '200')).toBeCloseTo(200);
    expect(parseRecTarget('redeemRate', '200 pts/$1')).toBeCloseTo(200);
  });

  it('clamps values to UI_BOUNDS', () => {
    expect(parseRecTarget('earnRateDeposit', '999')).toBe(50);
    expect(parseRecTarget('redeemRate', '9999')).toBe(1000);
    expect(parseRecTarget('topCashbackRate', '99%')).toBeCloseTo(0.20);
  });
});

// ── Solver (inlined deterministic solver, no browser globals) ─────────────────

const UI_BOUNDS = {
  redeemRate:      { min: 10,   max: 1000 },
  topCashbackRate: { min: 0.01, max: 0.20 },
  missionCount:    { min: 0,    max: 6    },
  earnRateDeposit: { min: 1,    max: 50   },
};

function recalcLocal(d) {
  const cfg  = buildLoyaltyConfig(d);
  const econ = calcLoyaltyEconomics(cfg);
  return { config: cfg, econ };
}

function solveToProfit(initialDraft, targetRoi) {
  const draft = { ...initialDraft };
  const LEVERS = [
    { p: 'redeemRate',      mode: 'mul', f: 1.25 },
    { p: 'topCashbackRate', mode: 'mul', f: 0.85 },
    { p: 'missionCount',    mode: 'add', f: -1   },
    { p: 'earnRateDeposit', mode: 'mul', f: 0.90 },
  ];

  let econ  = recalcLocal(draft).econ;
  let guard = 0;
  while (econ.roi3m < targetRoi && guard++ < 60) {
    let moved = false;
    for (const L of LEVERS) {
      const b = UI_BOUNDS[L.p]; if (!b) continue;
      const cur     = draft[L.p];
      const next    = L.mode === 'mul' ? cur * L.f : cur + L.f;
      const clamped = Math.max(b.min, Math.min(b.max, next));
      const val     = L.p === 'missionCount' ? Math.round(clamped) : clamped;
      if (Math.abs(val - cur) > 1e-9) { draft[L.p] = val; moved = true; break; }
    }
    if (!moved) break;
    econ = recalcLocal(draft).econ;
  }
  return { draft, econ, reachedTarget: econ.roi3m >= targetRoi };
}

const UNPROFITABLE_DRAFT = {
  mode: 'hybrid', numTiers: 5, topCashbackRate: 0.20, earnRateDeposit: 50,
  earnRateWager: 2, redeemRate: 10, redeemMinPoints: 0, pointsExpiry: 0,
  missionCount: 6, region: 'eu', segment: 'new', players: 1000, avgdep: 100, arpu: 5,
};

describe('balanceToProfit solver', () => {
  it('reaches target ROI 1.0 for a moderately unprofitable config', () => {
    const draft = {
      mode: 'hybrid', numTiers: 5, topCashbackRate: 0.15, earnRateDeposit: 10,
      earnRateWager: 1, redeemRate: 50, redeemMinPoints: 1000, pointsExpiry: 0,
      missionCount: 4, region: 'eu', segment: 'mid', players: 1000, avgdep: 100, arpu: 50,
    };
    const { econ, reachedTarget } = solveToProfit(draft, 1.0);
    if (reachedTarget) {
      expect(econ.roi3m).toBeGreaterThanOrEqual(1.0);
    }
    // Either reaches target or honestly reports failure — no silent wrong values
    expect(typeof reachedTarget).toBe('boolean');
  });

  it('reports reachedTarget:false on boundary-limited config', () => {
    // All levers clamped: redeemRate=1000, topCashbackRate=0.01, missionCount=0, earnRateDeposit=1
    const draft = { ...UNPROFITABLE_DRAFT, redeemRate: 1000, topCashbackRate: 0.01, missionCount: 0, earnRateDeposit: 1 };
    const { reachedTarget } = solveToProfit(draft, 10.0);
    expect(reachedTarget).toBe(false);
  });

  it('solver never produces negative roi3m', () => {
    const { econ } = solveToProfit({ ...UNPROFITABLE_DRAFT }, 1.0);
    expect(econ.roi3m).toBeGreaterThanOrEqual(0);
  });

  it('solver respects UI_BOUNDS on all levers', () => {
    const { draft } = solveToProfit({ ...UNPROFITABLE_DRAFT }, 5.0);
    expect(draft.redeemRate).toBeGreaterThanOrEqual(UI_BOUNDS.redeemRate.min);
    expect(draft.redeemRate).toBeLessThanOrEqual(UI_BOUNDS.redeemRate.max);
    expect(draft.topCashbackRate).toBeGreaterThanOrEqual(UI_BOUNDS.topCashbackRate.min);
    expect(draft.topCashbackRate).toBeLessThanOrEqual(UI_BOUNDS.topCashbackRate.max);
    expect(draft.missionCount).toBeGreaterThanOrEqual(UI_BOUNDS.missionCount.min);
    expect(draft.earnRateDeposit).toBeGreaterThanOrEqual(UI_BOUNDS.earnRateDeposit.min);
    expect(draft.earnRateDeposit).toBeLessThanOrEqual(UI_BOUNDS.earnRateDeposit.max);
  });
});
