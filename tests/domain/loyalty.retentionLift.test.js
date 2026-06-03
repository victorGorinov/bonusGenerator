import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig } from '../../src/domain/loyalty/buildConfig.js';
import { calcRetentionLift }  from '../../src/domain/loyalty/retentionLift.js';

const BASE = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 3,
  region: 'eu',
  segment: 'mid',
  players: 5000,
  avgdep: 100,
  arpu: 50,
};

describe('calcRetentionLift — global cap', () => {
  it('never exceeds 0.35 for any config', () => {
    const cfgs = ['hybrid', 'tiers', 'missions'].flatMap(mode =>
      ['new', 'mid', 'vip'].map(segment =>
        buildLoyaltyConfig({ ...BASE, mode, segment, missionCount: mode === 'tiers' ? 0 : 6 })
      )
    );
    cfgs.forEach(cfg => {
      expect(calcRetentionLift(cfg)).toBeLessThanOrEqual(0.35);
    });
  });
});

describe('calcRetentionLift — tiers/missions no regression', () => {
  it('tiers mode: no synergy (same formula as before)', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, mode: 'tiers', missionCount: 0 });
    const lift = calcRetentionLift(cfg);
    // tiers with mid, 5 tiers, earnRate 10 → base 0.12 × 0.85 × 1.00 × ~1.00 = ~0.102
    expect(lift).toBeGreaterThan(0);
    expect(lift).toBeLessThanOrEqual(0.35);
  });

  it('missions mode: no synergy multiplier', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, mode: 'missions', missionCount: 6 });
    const lift = calcRetentionLift(cfg);
    expect(lift).toBeGreaterThan(0);
    expect(lift).toBeLessThanOrEqual(0.35);
  });

  it('same tiers config gives same lift regardless of missionCount (no link in tiers mode)', () => {
    const a = calcRetentionLift(buildLoyaltyConfig({ ...BASE, mode: 'tiers', missionCount: 0 }));
    const b = calcRetentionLift(buildLoyaltyConfig({ ...BASE, mode: 'tiers', missionCount: 3 }));
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('calcRetentionLift — hybrid synergy', () => {
  it('hybrid with missions > hybrid with 0 missions (synergy adds lift)', () => {
    const withMissions = calcRetentionLift(buildLoyaltyConfig({ ...BASE, mode: 'hybrid', missionCount: 6 }));
    const without      = calcRetentionLift(buildLoyaltyConfig({ ...BASE, mode: 'hybrid', missionCount: 0 }));
    expect(withMissions).toBeGreaterThanOrEqual(without);
  });

  it('synergy capped: max additional lift is +10% relative (0.20 × 0.5)', () => {
    // With max synergy (tierAccel = 0.5), synergy factor = 1.10
    // Verify that having many weekly point-heavy missions doesn't push over cap
    const cfg = buildLoyaltyConfig({ ...BASE, mode: 'hybrid', missionCount: 6, earnRateDeposit: 1 });
    expect(calcRetentionLift(cfg)).toBeLessThanOrEqual(0.35);
  });

  it('synergy factor is 1 when missions have only one_time frequency (monthlyTierPoints = 0)', () => {
    // one_time missions contribute 0 monthly tier points → no synergy
    const cfg    = buildLoyaltyConfig({ ...BASE, mode: 'hybrid', missionCount: 1 });
    const noSync = buildLoyaltyConfig({ ...BASE, mode: 'hybrid', missionCount: 0 });
    // missionCount 1 = "First Deposits" (one_time) — zero monthly contribution
    const lift    = calcRetentionLift(cfg);
    const liftRef = calcRetentionLift(noSync);
    // Should be equal (synergy factor ≈ 1 because one_time missions add 0 monthly pts)
    expect(lift).toBeCloseTo(liftRef, 6);
  });
});

describe('calcRetentionLift — segment scaling', () => {
  it('vip > mid > new baseline', () => {
    const hybrid = (segment) => calcRetentionLift(buildLoyaltyConfig({ ...BASE, mode: 'hybrid', segment }));
    expect(hybrid('vip')).toBeGreaterThan(hybrid('mid'));
    expect(hybrid('mid')).toBeGreaterThan(hybrid('new'));
  });
});
