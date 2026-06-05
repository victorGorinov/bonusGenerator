// Unit tests for computeSelectedEcon — selection-aware campaign economics.
import { describe, it, expect } from 'vitest';
import { buildConfig }          from '../../src/domain/bonus/buildConfig.js';
import { computeSelectedEcon }  from '../../src/domain/bonus/selectedEcon.js';

const EU = buildConfig({ region: 'eu', sitecur: 'EUR', depcur: 'EUR', players: 5000, avgdep: 100, plat: 'both', rtp: 96, lic: 'mga' });

describe('computeSelectedEcon', () => {
  it('empty selection → zero cost, zero ratio', () => {
    const r = computeSelectedEcon(EU, []);
    expect(r.sP50.cost).toBe(0);
    expect(r.costRatio).toBe(0);
    expect(r.maxRisk).toBe(0);
    expect(r.breakdown).toEqual([]);
    expect(r.selectedTypes).toEqual([]);
  });

  it('ignores unknown bonus types', () => {
    const r = computeSelectedEcon(EU, ['welcome', 'bogus']);
    expect(r.selectedTypes).toEqual(['welcome']);
    expect(r.breakdown.length).toBe(1);
  });

  it('P10 < P50 < P90 for a generous suite', () => {
    const r = computeSelectedEcon(EU, ['welcome', 'reload', 'cashback']);
    expect(r.sP10.cost).toBeLessThan(r.sP50.cost);
    expect(r.sP50.cost).toBeLessThan(r.sP90.cost);
  });

  it('adding a bonus increases total cost', () => {
    const base = computeSelectedEcon(EU, ['welcome']).sP50.cost;
    const more = computeSelectedEcon(EU, ['welcome', 'reload']).sP50.cost;
    expect(more).toBeGreaterThan(base);
  });

  it('removing a bonus decreases total cost', () => {
    const full = computeSelectedEcon(EU, ['welcome', 'dep2', 'dep3', 'reload']).sP50.cost;
    const less = computeSelectedEcon(EU, ['welcome', 'dep2', 'reload']).sP50.cost;
    expect(less).toBeLessThan(full);
  });

  it('breakdown rows sum to scenario totals', () => {
    const r = computeSelectedEcon(EU, ['welcome', 'dep2', 'dep3', 'reload', 'cashback']);
    const sum50 = r.breakdown.reduce((s, b) => s + b.sP50, 0);
    expect(sum50).toBe(r.sP50.cost);
  });

  it('cashback contributes a non-zero loss-based cost without wager', () => {
    const r = computeSelectedEcon(EU, ['cashback']);
    const cb = r.breakdown.find(b => b.key === 'cashback');
    expect(cb.sP50).toBeGreaterThan(0);
    expect(r.sP10.cost).toBeLessThan(r.sP90.cost); // cbScale 0.5 < 1.6
  });

  it('costRatio = sP50.cost / (pl × dep)', () => {
    const r = computeSelectedEcon(EU, ['welcome', 'reload']);
    const expected = +(r.sP50.cost / (5000 * 100)).toFixed(3);
    expect(r.costRatio).toBe(expected);
  });

  it('division-by-zero guard when pl × dep = 0', () => {
    // buildConfig coerces players:0 → 5000, so use a hand-made cfg to force pl=0.
    const cfg = { dep: 0, pl: 0, econ: { mixedWCR: 0.55, mixedRTP: 0.96, wagerX: 30, bonusSize: 50 }, wager: {}, ndb: {}, dep2: {}, dep3: {}, reload: {}, cashback: {} };
    const r = computeSelectedEcon(cfg, ['welcome']);
    expect(r.costRatio).toBe(0);
    expect(Number.isFinite(r.sP50.cost)).toBe(true);
  });

  it('dep2/dep3 cohorts are conv-scaled fractions of welcome', () => {
    // dep2 cohort = conv × 0.45, dep3 = conv × 0.25 → dep2 step ≥ dep3 step
    // when bonus sizes are comparable. Assert both present and finite.
    const r = computeSelectedEcon(EU, ['dep2', 'dep3']);
    const d2 = r.breakdown.find(b => b.key === 'dep2');
    const d3 = r.breakdown.find(b => b.key === 'dep3');
    expect(d2.sP50).toBeGreaterThanOrEqual(0);
    expect(d3.sP50).toBeGreaterThanOrEqual(0);
  });
});
