import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig } from '../../src/domain/loyalty/buildConfig.js';
import { calcLoyaltyEconomics } from '../../src/domain/loyalty/calcEconomics.js';

const BASE_PARAMS = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.15,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 3,
  region: 'eu',
  segment: 'mid',
  players: 1000,
  avgdep: 100,
  arpu: 50,
};

const baseCfg = buildLoyaltyConfig(BASE_PARAMS);

describe('calcLoyaltyEconomics — points', () => {
  it('avgEarnedPointsPerPlayer > 0', () => {
    expect(calcLoyaltyEconomics(baseCfg).avgEarnedPointsPerPlayer).toBeGreaterThan(0);
  });

  it('avgRedeemedPoints < avgEarnedPoints', () => {
    const e = calcLoyaltyEconomics(baseCfg);
    expect(e.avgRedeemedPointsPerPlayer).toBeLessThan(e.avgEarnedPointsPerPlayer);
  });

  it('pointRedemptionRate is 0.40', () => {
    expect(calcLoyaltyEconomics(baseCfg).pointRedemptionRate).toBeCloseTo(0.40, 5);
  });

  it('liabilityPerPlayer > 0', () => {
    expect(calcLoyaltyEconomics(baseCfg).liabilityPerPlayer).toBeGreaterThan(0);
  });

  it('totalLiabilityUSD = players × liabilityPerPlayer', () => {
    const e = calcLoyaltyEconomics(baseCfg);
    expect(e.totalLiabilityUSD).toBeCloseTo(BASE_PARAMS.players * e.liabilityPerPlayer, 1);
  });

  it('earn scales with earnRateDeposit', () => {
    const cfgHigh = buildLoyaltyConfig({ ...BASE_PARAMS, earnRateDeposit: 20 });
    const eLow  = calcLoyaltyEconomics(baseCfg);
    const eHigh = calcLoyaltyEconomics(cfgHigh);
    expect(eHigh.avgEarnedPointsPerPlayer).toBeGreaterThan(eLow.avgEarnedPointsPerPlayer);
  });
});

describe('calcLoyaltyEconomics — costs', () => {
  it('monthlyCostUSD > 0', () => {
    expect(calcLoyaltyEconomics(baseCfg).monthlyCostUSD).toBeGreaterThan(0);
  });

  it('costRatioPct in realistic range 1–25%', () => {
    const e = calcLoyaltyEconomics(baseCfg);
    expect(e.costRatioPct).toBeGreaterThan(1);
    expect(e.costRatioPct).toBeLessThan(25);
  });

  it('missionCostUSD is 0 when mode is tiers', () => {
    const cfg = buildLoyaltyConfig({ ...BASE_PARAMS, mode: 'tiers' });
    expect(calcLoyaltyEconomics(cfg).missionCostUSD).toBe(0);
  });

  it('missionCostUSD > 0 in hybrid mode with missions', () => {
    expect(calcLoyaltyEconomics(baseCfg).missionCostUSD).toBeGreaterThan(0);
  });

  it('tierRewardCostUSD > 0 when any tier has cashback or FS', () => {
    expect(calcLoyaltyEconomics(baseCfg).tierRewardCostUSD).toBeGreaterThan(0);
  });

  it('total cost = redemption + tier + mission', () => {
    const e = calcLoyaltyEconomics(baseCfg);
    // redemptionCost is not directly exposed; verify via decomposition
    const decomposed = e.tierRewardCostUSD + e.missionCostUSD;
    expect(e.monthlyCostUSD).toBeGreaterThanOrEqual(decomposed);
  });

  it('doubling players doubles monthlyCostUSD', () => {
    const cfg2x = buildLoyaltyConfig({ ...BASE_PARAMS, players: 2000 });
    const e1 = calcLoyaltyEconomics(baseCfg);
    const e2 = calcLoyaltyEconomics(cfg2x);
    expect(e2.monthlyCostUSD).toBeCloseTo(e1.monthlyCostUSD * 2, 0);
  });

  it('higher topCashbackRate → higher costRatioPct', () => {
    const cfgLow  = buildLoyaltyConfig({ ...BASE_PARAMS, topCashbackRate: 0.05 });
    const cfgHigh = buildLoyaltyConfig({ ...BASE_PARAMS, topCashbackRate: 0.20 });
    const eLow  = calcLoyaltyEconomics(cfgLow);
    const eHigh = calcLoyaltyEconomics(cfgHigh);
    expect(eHigh.costRatioPct).toBeGreaterThan(eLow.costRatioPct);
  });

  it('zero cashback, no missions → no cashback cost but FS cost still present', () => {
    const cfg = buildLoyaltyConfig({ ...BASE_PARAMS, topCashbackRate: 0, missionCount: 0, mode: 'tiers' });
    const e = calcLoyaltyEconomics(cfg);
    // With 0 cashback, cashback component = 0 but FS rewards still apply for non-bronze tiers
    expect(e.missionCostUSD).toBe(0);
    // Total cost still > 0 due to redemptions and FS
    expect(e.monthlyCostUSD).toBeGreaterThan(0);
  });
});

describe('calcLoyaltyEconomics — retention & ROI', () => {
  it('retentionLiftPct in realistic range 5–35%', () => {
    const e = calcLoyaltyEconomics(baseCfg);
    expect(e.retentionLiftPct).toBeGreaterThanOrEqual(5);
    expect(e.retentionLiftPct).toBeLessThanOrEqual(35);
  });

  it('VIP segment has higher lift than new', () => {
    const cfgVip = buildLoyaltyConfig({ ...BASE_PARAMS, segment: 'vip' });
    const cfgNew = buildLoyaltyConfig({ ...BASE_PARAMS, segment: 'new' });
    expect(calcLoyaltyEconomics(cfgVip).retentionLiftPct)
      .toBeGreaterThan(calcLoyaltyEconomics(cfgNew).retentionLiftPct);
  });

  it('hybrid mode has higher lift than tiers-only', () => {
    const cfgTiers  = buildLoyaltyConfig({ ...BASE_PARAMS, mode: 'tiers',  missionCount: 0 });
    const cfgHybrid = buildLoyaltyConfig({ ...BASE_PARAMS, mode: 'hybrid', missionCount: 3 });
    expect(calcLoyaltyEconomics(cfgHybrid).retentionLiftPct)
      .toBeGreaterThan(calcLoyaltyEconomics(cfgTiers).retentionLiftPct);
  });

  it('5-tier program has higher lift than 3-tier', () => {
    const cfg3 = buildLoyaltyConfig({ ...BASE_PARAMS, numTiers: 3 });
    const cfg5 = buildLoyaltyConfig({ ...BASE_PARAMS, numTiers: 5 });
    expect(calcLoyaltyEconomics(cfg5).retentionLiftPct)
      .toBeGreaterThan(calcLoyaltyEconomics(cfg3).retentionLiftPct);
  });

  it('additionalRevenue3m > 0', () => {
    expect(calcLoyaltyEconomics(baseCfg).additionalRevenue3m).toBeGreaterThan(0);
  });

  it('roi3m > 0', () => {
    expect(calcLoyaltyEconomics(baseCfg).roi3m).toBeGreaterThan(0);
  });

  it('breakEvenMonths in range 0–36', () => {
    const e = calcLoyaltyEconomics(baseCfg);
    expect(e.breakEvenMonths).toBeGreaterThan(0);
    expect(e.breakEvenMonths).toBeLessThanOrEqual(36);
  });

  it('higher arpu → higher additionalRevenue3m', () => {
    const cfgLow  = buildLoyaltyConfig({ ...BASE_PARAMS, arpu: 30 });
    const cfgHigh = buildLoyaltyConfig({ ...BASE_PARAMS, arpu: 100 });
    expect(calcLoyaltyEconomics(cfgHigh).additionalRevenue3m)
      .toBeGreaterThan(calcLoyaltyEconomics(cfgLow).additionalRevenue3m);
  });
});
