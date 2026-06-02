// Parity test: recalcEconLocal (public/loyalty-econ.js) must match
// server-side buildLoyaltyConfig + calcLoyaltyEconomics for identical input.

import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig }   from '../../src/domain/loyalty/buildConfig.js';
import { calcLoyaltyEconomics } from '../../src/domain/loyalty/calcEconomics.js';
import { recalcEconLocal }      from '../../public/loyalty-econ.js';

const DRAFTS = [
  // 1. Default hybrid EU/mid
  { mode: 'hybrid',    numTiers: 5, topCashbackRate: 0.10, earnRateDeposit: 10, earnRateWager: 1,   redeemRate: 100,  redeemMinPoints: 1000, pointsExpiry: 0,  missionCount: 3, region: 'eu',    segment: 'mid', players: 5000,  avgdep: 100, arpu: 50  },
  // 2. Tiers-only CIS/vip, high cashback
  { mode: 'tiers',     numTiers: 3, topCashbackRate: 0.20, earnRateDeposit: 20, earnRateWager: 2,   redeemRate: 200,  redeemMinPoints: 500,  pointsExpiry: 12, missionCount: 0, region: 'cis',   segment: 'vip', players: 1000,  avgdep: 500, arpu: 200 },
  // 3. Missions-only sweep/new, low earn
  { mode: 'missions',  numTiers: 4, topCashbackRate: 0.05, earnRateDeposit: 5,  earnRateWager: 0.5, redeemRate: 50,   redeemMinPoints: 200,  pointsExpiry: 6,  missionCount: 6, region: 'sweep', segment: 'new', players: 10000, avgdep: 50,  arpu: 20  },
  // 4. Hybrid latam/mid, high redeem rate (tests solver lever boundary)
  { mode: 'hybrid',    numTiers: 4, topCashbackRate: 0.08, earnRateDeposit: 15, earnRateWager: 1.5, redeemRate: 500,  redeemMinPoints: 1000, pointsExpiry: 0,  missionCount: 2, region: 'latam', segment: 'mid', players: 2000,  avgdep: 80,  arpu: 35  },
  // 5. Tiers mn/vip, 5 tiers, big avgdep
  { mode: 'tiers',     numTiers: 5, topCashbackRate: 0.15, earnRateDeposit: 8,  earnRateWager: 1,   redeemRate: 100,  redeemMinPoints: 2000, pointsExpiry: 24, missionCount: 0, region: 'mn',    segment: 'vip', players: 500,   avgdep: 300, arpu: 120 },
];

const FIELDS        = ['monthlyCostUSD', 'costRatioPct', 'retentionLiftPct', 'roi3m', 'totalLiabilityUSD'];
const NULL_FIELDS   = ['breakEvenMonths'];

describe('loyalty-econ.js parity with server domain', () => {
  DRAFTS.forEach((draft, idx) => {
    it(`draft ${idx + 1} — key econ fields match server`, () => {
      const serverCfg  = buildLoyaltyConfig(draft);
      const serverEcon = calcLoyaltyEconomics(serverCfg);
      const { econ: clientEcon } = recalcEconLocal(draft);

      for (const field of FIELDS) {
        expect(clientEcon[field], `field: ${field}`).toBeCloseTo(serverEcon[field], 6);
      }
      for (const field of NULL_FIELDS) {
        if (serverEcon[field] === null) {
          expect(clientEcon[field], `field: ${field}`).toBeNull();
        } else {
          expect(clientEcon[field], `field: ${field}`).toBeCloseTo(serverEcon[field], 6);
        }
      }
    });
  });
});
