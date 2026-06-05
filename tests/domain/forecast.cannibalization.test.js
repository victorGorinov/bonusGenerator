import { describe, it, expect } from 'vitest';
import {
  MECHANIC_AFFINITY,
  audienceOverlap,
  overlapDaysFactor,
  pairCannibalization,
} from '../../src/domain/forecast/cannibalization.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function activity(overrides = {}) {
  return {
    id: 'a', title: 'A', type: 'reload', segment: 'all',
    startDate: '2026-06-01', endDate: '2026-06-07',
    incrementalRevenue: 1000, cost: 500, eligiblePlayers: 100,
    hasEcon: true,
    ...overrides,
  };
}

// ── matrix symmetry ───────────────────────────────────────────────────────────

describe('MECHANIC_AFFINITY', () => {
  const types = Object.keys(MECHANIC_AFFINITY);

  it('is symmetric: AFFINITY[a][b] === AFFINITY[b][a]', () => {
    for (const a of types) {
      for (const b of types) {
        expect(MECHANIC_AFFINITY[a][b]).toBe(MECHANIC_AFFINITY[b][a]);
      }
    }
  });

  it('diagonal values are 0.9 (self-cannibalization is highest)', () => {
    for (const t of types) {
      const self = MECHANIC_AFFINITY[t][t];
      expect(self).toBeGreaterThanOrEqual(0.5);
    }
  });
});

// ── audienceOverlap ───────────────────────────────────────────────────────────

describe('audienceOverlap', () => {
  it('same segment → 1.0', () => {
    expect(audienceOverlap(activity({ segment:'vip' }), activity({ segment:'vip' }))).toBe(1.0);
  });

  it("'all' + 'vip' → 0.10 (vip ratio)", () => {
    expect(audienceOverlap(
      activity({ segment:'all' }), activity({ segment:'vip' }),
    )).toBeCloseTo(0.10);
  });

  it("'vip' + 'all' → 0.10 (symmetric)", () => {
    expect(audienceOverlap(
      activity({ segment:'vip' }), activity({ segment:'all' }),
    )).toBeCloseTo(0.10);
  });

  it("'new' + 'vip' → 0 (disjoint)", () => {
    expect(audienceOverlap(
      activity({ segment:'new' }), activity({ segment:'vip' }),
    )).toBe(0);
  });

  it("'dormant' + 'dormant' → 1.0", () => {
    expect(audienceOverlap(
      activity({ segment:'dormant' }), activity({ segment:'dormant' }),
    )).toBe(1.0);
  });

  it("'all' + 'new' → 0.20", () => {
    expect(audienceOverlap(
      activity({ segment:'all' }), activity({ segment:'new' }),
    )).toBeCloseTo(0.20);
  });
});

// ── overlapDaysFactor ─────────────────────────────────────────────────────────

describe('overlapDaysFactor', () => {
  it('full overlap: same dates → 1.0', () => {
    const a = activity({ startDate:'2026-06-01', endDate:'2026-06-07' });
    const b = activity({ startDate:'2026-06-01', endDate:'2026-06-07' });
    expect(overlapDaysFactor(a, b)).toBe(1.0);
  });

  it('no overlap → 0', () => {
    const a = activity({ startDate:'2026-06-01', endDate:'2026-06-07' });
    const b = activity({ startDate:'2026-06-10', endDate:'2026-06-17' });
    expect(overlapDaysFactor(a, b)).toBe(0);
  });

  it('partial: 3-day overlap in a 7-day shorter campaign', () => {
    const a = activity({ startDate:'2026-06-05', endDate:'2026-06-11' }); // 7 days
    const b = activity({ startDate:'2026-06-01', endDate:'2026-06-07' }); // 7 days → overlap 5-7 = 3 days
    // min duration = 7, overlap = 3 days → factor = 3/7
    expect(overlapDaysFactor(a, b)).toBeCloseTo(3 / 7);
  });

  it('shorter campaign fully inside longer → 1.0', () => {
    const a = activity({ startDate:'2026-06-01', endDate:'2026-06-30' }); // 30 days
    const b = activity({ startDate:'2026-06-10', endDate:'2026-06-16' }); // 7 days (shorter)
    expect(overlapDaysFactor(a, b)).toBe(1.0);
  });
});

// ── pairCannibalization ───────────────────────────────────────────────────────

describe('pairCannibalization', () => {
  it('loss is applied to smaller revenue', () => {
    const a = activity({ id:'a', type:'reload', segment:'all',
                         incrementalRevenue: 2000, hasEcon: true });
    const b = activity({ id:'b', type:'reload', segment:'all',
                         incrementalRevenue: 500, hasEcon: true });
    const p = pairCannibalization(a, b);
    // minRev=500, overlap=1.0, affinity=0.9, daysFactor=1.0 → loss≈450
    expect(p.loss).toBe(Math.round(500 * 1.0 * 0.9 * 1.0));
  });

  it('hasEcon=false on either → loss=0', () => {
    const a = activity({ hasEcon: false, incrementalRevenue: 1000 });
    const b = activity({ hasEcon: true,  incrementalRevenue: 1000 });
    expect(pairCannibalization(a, b).loss).toBe(0);
  });

  it('disjoint segments → loss=0', () => {
    const a = activity({ segment:'new', hasEcon: true, incrementalRevenue: 1000 });
    const b = activity({ segment:'vip', hasEcon: true, incrementalRevenue: 1000 });
    expect(pairCannibalization(a, b).loss).toBe(0);
  });

  it('non-overlapping dates → loss=0', () => {
    const a = activity({ startDate:'2026-06-01', endDate:'2026-06-07', incrementalRevenue: 1000 });
    const b = activity({ startDate:'2026-06-15', endDate:'2026-06-21', incrementalRevenue: 1000 });
    expect(pairCannibalization(a, b).loss).toBe(0);
  });

  it('includes reason string with type and segment info', () => {
    const a = activity({ id:'a', type:'reload',  segment:'all', incrementalRevenue: 500 });
    const b = activity({ id:'b', type:'cashback', segment:'all', incrementalRevenue: 500 });
    const p = pairCannibalization(a, b);
    expect(p.reason).toMatch(/reload/);
    expect(p.reason).toMatch(/cashback/);
  });
});
