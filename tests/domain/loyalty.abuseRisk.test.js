import { describe, it, expect } from 'vitest';
import { assessLoyaltyAbuse } from '../../src/domain/loyalty/abuseRisk.js';

function cfg(over = {}) {
  return {
    earnRedeem: { earnRateDeposit: 10, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 5000, pointsExpiry: 180, ...(over.earnRedeem || {}) },
    tiers: [{ cashbackRate: 0.05 }, { cashbackRate: 0.10 }],
    missions: [],
    hasMissions: false,
    avgdep: 100,
    ...over,
  };
}
const find = (a, k) => a.vectors.find((v) => v.key === k);

describe('assessLoyaltyAbuse — EV loop anchor', () => {
  it('flags critical when wager rebate ≥ house edge (3%)', () => {
    // earnRateWager 5 / redeemRate 100 = 5% > 3%
    const a = assessLoyaltyAbuse(cfg({ earnRedeem: { earnRateDeposit: 10, earnRateWager: 5, redeemRate: 100, redeemMinPoints: 5000, pointsExpiry: 180 } }));
    expect(find(a, 'ev_positive_loop').severity).toBe('critical');
    // A lone critical vector (weight 55, below the cumulative-60 cutoff) must still floor to level 'critical'.
    expect(a.vectors).toHaveLength(1);
    expect(a.level).toBe('critical');
  });

  it('flags warn when rebate is 60–100% of house edge', () => {
    // 2/100 = 2% ; 2/3 = 0.67 → warn
    const a = assessLoyaltyAbuse(cfg({ earnRedeem: { earnRateDeposit: 10, earnRateWager: 2, redeemRate: 100, redeemMinPoints: 5000, pointsExpiry: 180 } }));
    expect(find(a, 'ev_positive_loop').severity).toBe('warn');
  });

  it('does not flag a conservative 1% wager rebate', () => {
    const a = assessLoyaltyAbuse(cfg());
    expect(find(a, 'ev_positive_loop')).toBeUndefined();
  });
});

describe('assessLoyaltyAbuse — structural vectors', () => {
  it('flags a high direct deposit rebate', () => {
    // earnRateDeposit 25 / redeemRate 100 = 25% → high
    const a = assessLoyaltyAbuse(cfg({ earnRedeem: { earnRateDeposit: 25, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 5000, pointsExpiry: 180 } }));
    expect(find(a, 'deposit_rebate_high').severity).toBe('high');
  });

  it('flags redeem-in-one-cycle when a single avg deposit unlocks redemption', () => {
    // avgdep 100 × earnRateDeposit 10 = 1000 pts ≥ redeemMinPoints 800
    const a = assessLoyaltyAbuse(cfg({ avgdep: 100, earnRedeem: { earnRateDeposit: 10, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 800, pointsExpiry: 180 } }));
    const v = find(a, 'redeem_no_wager');
    expect(v.severity).toBe('warn');
    // observed = points earned per cycle (1000); threshold = redemption floor it clears (800).
    expect(v.current).toBe(1000);
    expect(v.threshold).toBe(800);
  });

  it('flags top-tier cashback ≥20% as high', () => {
    const a = assessLoyaltyAbuse(cfg({ tiers: [{ cashbackRate: 0.05 }, { cashbackRate: 0.22 }] }));
    expect(find(a, 'tier_gaming').severity).toBe('high');
  });

  it('flags repeatable cash-bonus missions', () => {
    const a = assessLoyaltyAbuse(cfg({ hasMissions: true, missions: [{ rewardType: 'cash_bonus', frequency: 'weekly', rewardValue: 20 }] }));
    expect(find(a, 'mission_exploit').severity).toBe('warn');
  });

  it('emits points_no_expiry info note when pointsExpiry is 0', () => {
    const a = assessLoyaltyAbuse(cfg({ earnRedeem: { earnRateDeposit: 10, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 5000, pointsExpiry: 0 } }));
    expect(find(a, 'points_no_expiry').severity).toBe('info');
  });

  it('is quiet (level low) on a well-balanced program', () => {
    const a = assessLoyaltyAbuse(cfg());
    expect(a.level).toBe('low');
  });
});
