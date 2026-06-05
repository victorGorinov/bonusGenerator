import { describe, it, expect } from 'vitest';
import { aggregateForecast } from '../../src/domain/forecast/aggregateForecast.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

function camp(overrides = {}) {
  return {
    id: 'c1', title: 'A', type: 'reload', segment: 'all',
    startDate: '2026-06-01', endDate: '2026-06-07',
    sourceType: 'tournament_generator',
    econ: { ggrLiftMid: 1000, prizePoolCost: 400, eligible: 200 },
    ...overrides,
  };
}

const PERIOD = ['2026-06-01', '2026-06-30'];

// ── edge cases ────────────────────────────────────────────────────────────────

describe('aggregateForecast — edge cases', () => {
  it('0 activities → all zeros, empty arrays', () => {
    const f = aggregateForecast([], ...PERIOD);
    expect(f.gross).toBe(0);
    expect(f.overlapLoss).toBe(0);
    expect(f.net).toBe(0);
    expect(f.pairs).toHaveLength(0);
    expect(f.coverage).toEqual({ total: 0, withEcon: 0, withoutEcon: 0 });
  });

  it('1 activity → overlapLoss=0', () => {
    const f = aggregateForecast([camp()], ...PERIOD);
    expect(f.overlapLoss).toBe(0);
    expect(f.gross).toBe(1000);
    expect(f.pairs).toHaveLength(0);
  });

  it('activity outside period is excluded', () => {
    const outside = camp({ startDate:'2026-07-01', endDate:'2026-07-07' });
    const f = aggregateForecast([outside], ...PERIOD);
    expect(f.coverage.total).toBe(0);
    expect(f.gross).toBe(0);
  });

  it('no-econ campaigns count in coverage.withoutEcon but contribute 0 revenue', () => {
    const noEcon = camp({ sourceType: 'manual', econ: null });
    const f = aggregateForecast([noEcon], ...PERIOD);
    expect(f.coverage.withoutEcon).toBe(1);
    expect(f.gross).toBe(0);
  });
});

// ── full overlap ──────────────────────────────────────────────────────────────

describe('aggregateForecast — full overlap pair', () => {
  it('same-type same-segment fully overlapping → loss > 0', () => {
    const a = camp({ id:'a', type:'reload', segment:'all',
                     startDate:'2026-06-01', endDate:'2026-06-07',
                     econ: { ggrLiftMid: 2000, prizePoolCost: 800, eligible: 400 } });
    const b = camp({ id:'b', type:'reload', segment:'all',
                     startDate:'2026-06-01', endDate:'2026-06-07',
                     econ: { ggrLiftMid: 1000, prizePoolCost: 400, eligible: 200 } });
    const f = aggregateForecast([a, b], ...PERIOD);
    expect(f.gross).toBe(3000);
    // minRev=1000, overlap=1.0, affinity=0.9 (reload×reload), daysFactor=1.0
    const expectedLoss = Math.round(1000 * 1.0 * 0.9 * 1.0);
    expect(f.overlapLoss).toBe(expectedLoss);
    expect(f.net).toBe(Math.max(0, 3000 - expectedLoss));
    expect(f.pairs).toHaveLength(1);
  });
});

// ── no overlap ────────────────────────────────────────────────────────────────

describe('aggregateForecast — no overlap', () => {
  it('different segments → no cannibalization', () => {
    const a = camp({ id:'a', segment:'new', econ: { ggrLiftMid: 1000, prizePoolCost: 400, eligible: 200 } });
    const b = camp({ id:'b', segment:'vip', econ: { ggrLiftMid: 1000, prizePoolCost: 400, eligible: 100 } });
    const f = aggregateForecast([a, b], ...PERIOD);
    expect(f.overlapLoss).toBe(0);
    expect(f.pairs).toHaveLength(0);
  });

  it('sequential dates → no cannibalization', () => {
    const a = camp({ id:'a', startDate:'2026-06-01', endDate:'2026-06-07', econ: { ggrLiftMid: 1000, prizePoolCost: 400, eligible: 200 } });
    const b = camp({ id:'b', startDate:'2026-06-08', endDate:'2026-06-14', econ: { ggrLiftMid: 1000, prizePoolCost: 400, eligible: 200 } });
    const f = aggregateForecast([a, b], ...PERIOD);
    expect(f.overlapLoss).toBe(0);
  });
});

// ── coverage ──────────────────────────────────────────────────────────────────

describe('aggregateForecast — coverage', () => {
  it('counts withEcon and withoutEcon correctly', () => {
    const withE  = camp({ id:'e1' });
    const withE2 = camp({ id:'e2' });
    const noE    = camp({ id:'n1', sourceType:'manual', econ: null });
    const f = aggregateForecast([withE, withE2, noE], ...PERIOD);
    expect(f.coverage.total).toBe(3);
    expect(f.coverage.withEcon).toBe(2);
    expect(f.coverage.withoutEcon).toBe(1);
  });
});

// ── byDay integrity ───────────────────────────────────────────────────────────

describe('aggregateForecast — byDay', () => {
  it('Σ byDay.grossRevenue ≈ gross (within rounding)', () => {
    const a = camp({ id:'a', startDate:'2026-06-01', endDate:'2026-06-07',
                     econ: { ggrLiftMid: 700, prizePoolCost: 200, eligible: 100 } });
    const b = camp({ id:'b', startDate:'2026-06-05', endDate:'2026-06-14',
                     econ: { ggrLiftMid: 900, prizePoolCost: 300, eligible: 150 } });
    const f = aggregateForecast([a, b], '2026-06-01', '2026-06-14');
    const sumGross = f.byDay.reduce((s, d) => s + d.grossRevenue, 0);
    expect(Math.abs(sumGross - f.gross)).toBeLessThanOrEqual(f.byDay.length);
  });

  it('each day in period appears in byDay', () => {
    const f = aggregateForecast([camp()], '2026-06-01', '2026-06-07');
    expect(f.byDay).toHaveLength(7);
    expect(f.byDay[0].date).toBe('2026-06-01');
    expect(f.byDay[6].date).toBe('2026-06-07');
  });

  it('days without activity have grossRevenue=0', () => {
    const c = camp({ startDate:'2026-06-05', endDate:'2026-06-07' });
    const f = aggregateForecast([c], '2026-06-01', '2026-06-10');
    expect(f.byDay[0].grossRevenue).toBe(0); // Jun 1 — before campaign
    expect(f.byDay[9].grossRevenue).toBe(0); // Jun 10 — after campaign
  });
});

// ── pairs ordering ────────────────────────────────────────────────────────────

describe('aggregateForecast — pairs ordering', () => {
  it('pairs sorted by descending loss, only loss > 0', () => {
    const a = camp({ id:'a', type:'reload',   segment:'all', startDate:'2026-06-01', endDate:'2026-06-07',
                     econ: { ggrLiftMid: 2000, prizePoolCost: 800, eligible: 400 } });
    const b = camp({ id:'b', type:'reload',   segment:'all', startDate:'2026-06-01', endDate:'2026-06-07',
                     econ: { ggrLiftMid: 500, prizePoolCost: 200, eligible: 100 } });
    // a+b: reload×reload overlap=1.0 → high loss
    // different segments would be 0 loss
    const c = camp({ id:'c', type:'vip', segment:'new',
                     econ: { ggrLiftMid: 5000, prizePoolCost: 2000, eligible: 200 } });
    const f = aggregateForecast([a, b, c], ...PERIOD);
    for (let i = 0; i < f.pairs.length - 1; i++) {
      expect(f.pairs[i].loss).toBeGreaterThanOrEqual(f.pairs[i + 1].loss);
    }
    expect(f.pairs.every(p => p.loss > 0)).toBe(true);
  });
});
