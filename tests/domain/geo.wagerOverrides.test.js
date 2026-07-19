// A4 data fixes: verify the geo/license wager overrides land in buildConfig output.
//  · DGA (Denmark) welcome wager capped to the 10x legal ceiling (was 25).
//  · MX (segob) / PE (mincetur) welcome wager overridden to 35 (was inheriting base 40).
//  · AR/CL (base LATAM, license 'none') keep the offshore base 40.

import { describe, it, expect } from 'vitest';
import { buildConfig } from '../../src/domain/bonus/buildConfig.js';

const base = { players: 5000, plat: 'both', rtp: 96 };

describe('geo wager overrides (A4)', () => {
  it('DGA welcome wager = 10 (legal cap, was 25)', () => {
    const cfg = buildConfig({ ...base, region: 'eu', sitecur: 'DKK', depcur: 'DKK', avgdep: 700, lic: 'dga' });
    expect(cfg.wager.wW).toBe(10);
  });

  it('DGA/UKGC 10× cap applies to ALL wager fields, not just welcome', () => {
    for (const lic of ['dga', 'ukgc']) {
      const cfg = buildConfig({ ...base, region: 'eu', sitecur: 'GBP', depcur: 'GBP', avgdep: 100, lic });
      expect(cfg.wager.wW, `${lic} wW`).toBeLessThanOrEqual(10);
      expect(cfg.wager.wN, `${lic} wN`).toBeLessThanOrEqual(10);
      expect(cfg.wager.wR, `${lic} wR (reload)`).toBeLessThanOrEqual(10); // was inheriting base 25
      expect(cfg.wager.wF, `${lic} wF`).toBeLessThanOrEqual(10);
      expect(cfg.dep2.wager, `${lic} dep2`).toBeLessThanOrEqual(10);
      expect(cfg.dep3.wager, `${lic} dep3`).toBeLessThanOrEqual(10); // was floored at 25
    }
  });

  it('uncapped license (MGA) keeps its higher wagers', () => {
    const cfg = buildConfig({ ...base, region: 'eu', sitecur: 'EUR', depcur: 'EUR', avgdep: 100, lic: 'mga' });
    expect(cfg.wager.wR).toBe(25);
    expect(cfg.dep3.wager).toBeGreaterThan(10);
  });

  it('Mexico (segob) welcome wager = 35 (override, not base 40)', () => {
    const cfg = buildConfig({ ...base, region: 'latam', sitecur: 'USD', depcur: 'USD', avgdep: 35, lic: 'segob' });
    expect(cfg.wager.wW).toBe(35);
  });

  it('Peru (mincetur) welcome wager = 35 (override, not base 40)', () => {
    const cfg = buildConfig({ ...base, region: 'latam', sitecur: 'USD', depcur: 'USD', avgdep: 30, lic: 'mincetur' });
    expect(cfg.wager.wW).toBe(35);
  });

  it('Argentina/Chile (base LATAM, none) keep offshore base wager 40', () => {
    const cfg = buildConfig({ ...base, region: 'latam', sitecur: 'USD', depcur: 'USD', avgdep: 30, lic: 'none' });
    expect(cfg.wager.wW).toBe(40);
  });

  it('Brazil (bets_br) keeps its own wager override 35', () => {
    const cfg = buildConfig({ ...base, region: 'latam', sitecur: 'USD', depcur: 'USD', avgdep: 30, lic: 'bets_br' });
    expect(cfg.wager.wW).toBe(35);
  });
});
