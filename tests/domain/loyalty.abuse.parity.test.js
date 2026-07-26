// Parity: public/loyalty-abuse.js must match src/domain/loyalty/abuseRisk.ts.
import { describe, it, expect } from 'vitest';
import { assessLoyaltyAbuse as srv } from '../../src/domain/loyalty/abuseRisk.js';
import { assessLoyaltyAbuse as cli } from '../../public/loyalty-abuse.js';

const CASES = [];
for (const earnRateWager of [0.5, 1, 2, 5]) {
  for (const earnRateDeposit of [5, 10, 25]) {
    for (const redeemRate of [50, 100]) {
      for (const redeemMinPoints of [800, 5000]) {
        for (const pointsExpiry of [0, 180]) {
          for (const topCb of [0.10, 0.15, 0.22]) {
            CASES.push({
              earnRedeem: { earnRateDeposit, earnRateWager, redeemRate, redeemMinPoints, pointsExpiry },
              tiers: [{ cashbackRate: 0.05 }, { cashbackRate: topCb }],
              missions: [{ rewardType: 'cash_bonus', frequency: 'weekly', rewardValue: 20 }],
              hasMissions: true,
              avgdep: 100,
            });
          }
        }
      }
    }
  }
}

describe('loyalty-abuse.js parity with abuseRisk.ts', () => {
  it('matches across the full input matrix', () => {
    for (const c of CASES) {
      expect(cli(c), JSON.stringify(c)).toEqual(srv(c));
    }
  });
});
