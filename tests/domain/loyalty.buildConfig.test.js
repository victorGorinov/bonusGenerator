import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig } from '../../src/domain/loyalty/buildConfig.js';

const BASE = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.15,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 4,
  region: 'eu',
  segment: 'mid',
  players: 1000,
  avgdep: 100,
  arpu: 50,
};

describe('buildLoyaltyConfig — tiers', () => {
  it('returns correct number of tiers', () => {
    expect(buildLoyaltyConfig(BASE).tiers).toHaveLength(5);
    expect(buildLoyaltyConfig({ ...BASE, numTiers: 4 }).tiers).toHaveLength(4);
    expect(buildLoyaltyConfig({ ...BASE, numTiers: 3 }).tiers).toHaveLength(3);
  });

  it('bronze is always first and has 0 minPoints', () => {
    const cfg = buildLoyaltyConfig(BASE);
    expect(cfg.tiers[0].name).toBe('bronze');
    expect(cfg.tiers[0].minPoints).toBe(0);
  });

  it('tier minPoints increase monotonically', () => {
    const cfg = buildLoyaltyConfig(BASE);
    for (let i = 1; i < cfg.tiers.length; i++) {
      expect(cfg.tiers[i].minPoints).toBeGreaterThan(cfg.tiers[i - 1].minPoints);
    }
  });

  it('top tier cashback equals topCashbackRate', () => {
    const cfg = buildLoyaltyConfig(BASE);
    expect(cfg.tiers[cfg.tiers.length - 1].cashbackRate).toBeCloseTo(0.15, 10);
  });

  it('bronze cashback is 0', () => {
    expect(buildLoyaltyConfig(BASE).tiers[0].cashbackRate).toBe(0);
  });

  it('bonusMultiplier increases with tier level', () => {
    const cfg = buildLoyaltyConfig(BASE);
    for (let i = 1; i < cfg.tiers.length; i++) {
      expect(cfg.tiers[i].bonusMultiplier).toBeGreaterThan(cfg.tiers[i - 1].bonusMultiplier);
    }
  });

  it('freeSpinsMonthly increases with tier level', () => {
    const cfg = buildLoyaltyConfig(BASE);
    for (let i = 1; i < cfg.tiers.length; i++) {
      expect(cfg.tiers[i].freeSpinsMonthly).toBeGreaterThanOrEqual(cfg.tiers[i - 1].freeSpinsMonthly);
    }
  });

  it('4-tier config ends with platinum', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, numTiers: 4 });
    expect(cfg.tiers[3].name).toBe('platinum');
  });

  it('3-tier config ends with gold', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, numTiers: 3 });
    expect(cfg.tiers[2].name).toBe('gold');
  });

  it('thresholds scale with avgdep × earnRateDeposit', () => {
    const cfg50  = buildLoyaltyConfig({ ...BASE, avgdep: 50 });
    const cfg200 = buildLoyaltyConfig({ ...BASE, avgdep: 200 });
    expect(cfg200.tiers[1].minPoints).toBeGreaterThan(cfg50.tiers[1].minPoints);
  });
});

describe('buildLoyaltyConfig — missions', () => {
  it('hybrid mode includes missions', () => {
    const cfg = buildLoyaltyConfig(BASE);
    expect(cfg.hasMissions).toBe(true);
    expect(cfg.missions).toHaveLength(4);
  });

  it('tiers mode excludes missions', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, mode: 'tiers' });
    expect(cfg.hasMissions).toBe(false);
    expect(cfg.missions).toHaveLength(0);
  });

  it('missions mode includes missions', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, mode: 'missions', missionCount: 3 });
    expect(cfg.hasMissions).toBe(true);
    expect(cfg.missions).toHaveLength(3);
  });

  it('missionCount 0 → empty missions even in hybrid', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, missionCount: 0 });
    expect(cfg.missions).toHaveLength(0);
    expect(cfg.hasMissions).toBe(false);
  });

  it('missions have unique ids', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const ids = cfg.missions.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mission targets are positive numbers', () => {
    const cfg = buildLoyaltyConfig(BASE);
    cfg.missions.forEach(m => expect(m.target).toBeGreaterThan(0));
  });

  it('mission reward values are positive', () => {
    const cfg = buildLoyaltyConfig(BASE);
    cfg.missions.forEach(m => expect(m.rewardValue).toBeGreaterThan(0));
  });

  it('wager mission targets scale with avgdep', () => {
    // missionCount 3 includes the High Roller Week (wager) mission
    const cfg100 = buildLoyaltyConfig({ ...BASE, avgdep: 100, missionCount: 3 });
    const cfg200 = buildLoyaltyConfig({ ...BASE, avgdep: 200, missionCount: 3 });
    const wager100 = cfg100.missions.find(m => m.objective === 'wager');
    const wager200 = cfg200.missions.find(m => m.objective === 'wager');
    if (wager100 && wager200) {
      expect(wager200.target).toBeGreaterThan(wager100.target);
    }
  });
});

describe('buildLoyaltyConfig — metadata', () => {
  it('preserves region and segment', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, region: 'cis', segment: 'vip' });
    expect(cfg.region).toBe('cis');
    expect(cfg.segment).toBe('vip');
  });

  it('preserves earnRedeem config', () => {
    const cfg = buildLoyaltyConfig(BASE);
    expect(cfg.earnRedeem.earnRateDeposit).toBe(10);
    expect(cfg.earnRedeem.redeemRate).toBe(100);
    expect(cfg.earnRedeem.pointsExpiry).toBe(0);
  });

  it('preserves mode', () => {
    expect(buildLoyaltyConfig({ ...BASE, mode: 'tiers' }).mode).toBe('tiers');
    expect(buildLoyaltyConfig({ ...BASE, mode: 'missions' }).mode).toBe('missions');
    expect(buildLoyaltyConfig({ ...BASE, mode: 'hybrid' }).mode).toBe('hybrid');
  });
});
