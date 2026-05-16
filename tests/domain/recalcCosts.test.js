import { describe, it, expect } from 'vitest';
import { buildConfig }   from '../../src/domain/bonus/buildConfig.js';
import { recalcCosts }   from '../../src/domain/bonus/recalcCosts.js';

const cfg = buildConfig({
  region: 'eu', lic: 'mga', sitecur: 'EUR', depcur: 'EUR',
  avgdep: 100, players: 5000, plat: 'both', rtp: 96,
});

describe('recalcCosts — defaults (no overrides)', () => {
  const result = recalcCosts(cfg, {});

  it('returns costs object',          () => expect(result.costs).toBeDefined());
  it('total = sum of components', () => {
    const { w_p50, ndb, rl, d2, d3, fs } = result.costs;
    expect(result.costs.total).toBe(w_p50 + ndb + rl + d2 + d3 + fs);
  });
  it('w_p10 ≤ w_p50 ≤ w_p90',        () => {
    expect(result.costs.w_p10).toBeLessThanOrEqual(result.costs.w_p50);
    expect(result.costs.w_p50).toBeLessThanOrEqual(result.costs.w_p90);
  });
  it('ratio ≥ 0',                     () => expect(result.ratio).toBeGreaterThanOrEqual(0));
  it('maxRisk > 0',                   () => expect(result.maxRisk).toBeGreaterThan(0));
});

describe('recalcCosts — overrides', () => {
  // Use below-breakeven wager (10 < ~21) so that pct increase reliably raises cost
  it('higher welcome pct → higher cost (below-breakeven wager)', () => {
    const base = recalcCosts(cfg, { w_wager: 10 });
    const high = recalcCosts(cfg, { w_wager: 10, w_pct: 200 });
    expect(high.costs.w_p50).toBeGreaterThan(base.costs.w_p50);
  });

  it('higher wager → lower w_p50', () => {
    const base = recalcCosts(cfg, {});
    const high = recalcCosts(cfg, { w_wager: 80 });
    expect(high.costs.w_p50).toBeLessThan(base.costs.w_p50);
  });

  it('lower maxB → lower maxRisk', () => {
    const base = recalcCosts(cfg, {});
    const low  = recalcCosts(cfg, { w_maxB: 50 });
    expect(low.maxRisk).toBeLessThan(base.maxRisk);
  });

  it('invalid override (0) falls back to default', () => {
    const base = recalcCosts(cfg, {});
    const same = recalcCosts(cfg, { w_pct: 0 });
    expect(same.costs.w_p50).toBe(base.costs.w_p50);
  });
});

describe('recalcCosts — sweep region', () => {
  const sweepCfg = buildConfig({
    region: 'sweep', sitecur: 'USD', depcur: 'USD',
    avgdep: 20, players: 5000, plat: 'both', rtp: 96,
  });

  it('all costs = 0 (no wager)', () => {
    const result = recalcCosts(sweepCfg, {});
    expect(result.costs.w_p50).toBe(0);
    expect(result.costs.total).toBe(0);
  });
});
