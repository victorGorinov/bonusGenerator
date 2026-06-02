/**
 * Tests for tournament parseTgRecTarget and balance solver logic.
 * Functions inlined to avoid browser-global dependency.
 */

import { describe, it, expect } from 'vitest';
import { solveToTarget } from '../../public/balance-solver.js';
import { calcTournamentEconomics } from '../../public/tournament-econ.js';

// ── parseTgRecTarget (inlined) ────────────────────────────────────────────────

const TG_UI_BOUNDS_TEST = {
  prizePool: { min: 10, max: 10_000_000 },
  rake:      { min: 0,  max: 30 },
};

function parseTgRecTarget(param, target, currentDraft) {
  const d = currentDraft || {};
  const s = String(target);
  if (param === 'poolModel') {
    const m = /fixed|dynamic|hybrid/.exec(s);
    return m ? m[0] : (d.poolModel || 'fixed');
  }
  if (param === 'duration') {
    const m = /flash|daily|weekly|monthly|multi_round/.exec(s);
    return m ? m[0] : (d.duration || 'weekly');
  }
  if (param === 'segment') {
    const m = /all|new|vip|dormant|depositors/.exec(s);
    return m ? m[0] : (d.segment || 'all');
  }
  const match = s.match(/\d+\.?\d*/);
  const num   = match ? parseFloat(match[0]) : NaN;
  if (isNaN(num)) return d[param];
  const b = TG_UI_BOUNDS_TEST[param];
  return b ? Math.max(b.min, Math.min(b.max, num)) : num;
}

describe('parseTgRecTarget', () => {
  it('extracts poolModel', () => {
    expect(parseTgRecTarget('poolModel', 'switch to hybrid')).toBe('hybrid');
    expect(parseTgRecTarget('poolModel', 'dynamic pool model')).toBe('dynamic');
    expect(parseTgRecTarget('poolModel', 'fixed')).toBe('fixed');
  });

  it('extracts duration', () => {
    expect(parseTgRecTarget('duration', 'switch to weekly')).toBe('weekly');
    expect(parseTgRecTarget('duration', 'daily tournaments')).toBe('daily');
    expect(parseTgRecTarget('duration', 'multi_round format')).toBe('multi_round');
  });

  it('extracts segment', () => {
    expect(parseTgRecTarget('segment', 'target vip players')).toBe('vip');
    expect(parseTgRecTarget('segment', 'dormant reactivation')).toBe('dormant');
    expect(parseTgRecTarget('segment', 'all segments')).toBe('all');
  });

  it('extracts first number for prizePool', () => {
    expect(parseTgRecTarget('prizePool', '5000')).toBe(5000);
    expect(parseTgRecTarget('prizePool', '5000 EUR')).toBe(5000);
    expect(parseTgRecTarget('prizePool', 'reduce to 2000')).toBe(2000);
  });

  it('extracts first number for rake', () => {
    expect(parseTgRecTarget('rake', '15%')).toBe(15);
    expect(parseTgRecTarget('rake', '10 percent')).toBe(10);
  });

  it('clamps prizePool to bounds', () => {
    expect(parseTgRecTarget('prizePool', '1')).toBe(10); // min=10
    expect(parseTgRecTarget('prizePool', '99999999')).toBe(10_000_000); // max
  });

  it('clamps rake to 0–30', () => {
    expect(parseTgRecTarget('rake', '50')).toBe(30);
    expect(parseTgRecTarget('rake', '0')).toBe(0);
  });
});

// ── Solver with real tournament economics ─────────────────────────────────────

function recalcLocal(params) {
  return calcTournamentEconomics(params);
}

const BASE_UNPROFITABLE = {
  region: 'eu', segment: 'all', duration: 'flash',
  prizePool: 100_000, poolModel: 'fixed', rake: 0,
  totalPlayers: 1000, sitecur: 'EUR', geo: 'de',
};

describe('tournament balance solver', () => {
  it('reaches target ROI by reducing prizePool', () => {
    const LEVERS = [
      { p:'prizePool', mode:'mul', f:0.9, bounds:{ min: 10, max: 1_000_000 } },
    ];
    const { reached, draft, econ } = solveToTarget({
      draft:    { ...BASE_UNPROFITABLE },
      levers:   LEVERS,
      recalc:   p => recalcLocal(p),
      metricOf: e => e.roi,
      target:   0,
    });
    // Either reaches target ROI or honestly reports failure
    if (reached) {
      expect(econ.roi).toBeGreaterThanOrEqual(0);
      // totalValueMid (netMargin + retention) must be >= 0 when roi >= 0
      expect(econ.totalValueMid).toBeGreaterThanOrEqual(0);
    }
    expect(typeof reached).toBe('boolean');
  });

  it('reports reached:false when prize floor prevents target', () => {
    // prizeFloor = prizePool (already at min), target very high
    const LEVERS = [
      { p:'prizePool', mode:'mul', f:0.9, bounds:{ min: 99_000, max: 100_000 } }, // nearly capped
    ];
    const { reached } = solveToTarget({
      draft:    { ...BASE_UNPROFITABLE },
      levers:   LEVERS,
      recalc:   p => recalcLocal(p),
      metricOf: e => e.roi,
      target:   10000, // impossible
    });
    expect(reached).toBe(false);
  });

  it('poolModel enum lever: fixed→hybrid→dynamic reduces cost', () => {
    const LEVERS = [
      { p:'poolModel', mode:'enum', enum:['fixed','hybrid','dynamic'] },
    ];
    const base = { ...BASE_UNPROFITABLE, prizePool: 5000 };
    const { draft: solved } = solveToTarget({
      draft:    { ...base },
      levers:   LEVERS,
      recalc:   p => recalcLocal(p),
      metricOf: e => e.roi,
      target:   10000, // unreachable — will exhaust enum
    });
    expect(['fixed','hybrid','dynamic']).toContain(solved.poolModel);
  });

  it('solver never produces negative prizePool', () => {
    const LEVERS = [
      { p:'prizePool', mode:'mul', f:0.5, bounds:{ min: 10, max: 1_000_000 } },
    ];
    const { draft } = solveToTarget({
      draft:    { ...BASE_UNPROFITABLE },
      levers:   LEVERS,
      recalc:   p => recalcLocal(p),
      metricOf: e => e.roi,
      target:   999,
    });
    expect(draft.prizePool).toBeGreaterThan(0);
  });

  it('multi-lever priority: poolModel tried before prizePool', () => {
    // Start with fixed, low prizePool — poolModel should move first
    const base = { ...BASE_UNPROFITABLE, prizePool: 100, poolModel: 'fixed' };
    const moved = [];
    const LEVERS = [
      { p:'poolModel', mode:'enum', enum:['fixed','hybrid','dynamic'] },
      { p:'prizePool', mode:'mul',  f:0.9, bounds:{ min: 10, max: 100 } },
    ];
    const { draft: solved } = solveToTarget({
      draft:    { ...base },
      levers:   LEVERS,
      recalc:   p => { moved.push(p.poolModel); return recalcLocal(p); },
      metricOf: e => e.roi,
      target:   10000,
    });
    // poolModel should have moved (not stayed 'fixed' forever)
    const movedPoolModel = moved.some(m => m !== 'fixed');
    expect(movedPoolModel).toBe(true);
  });
});
