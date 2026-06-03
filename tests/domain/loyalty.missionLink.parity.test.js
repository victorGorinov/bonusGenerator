// Parity test: loyalty-missions-link.js (browser) must match
// src/domain/loyalty/linkMissions.ts (backend) for identical inputs.

import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig } from '../../src/domain/loyalty/buildConfig.js';
import { linkMissionsToTiers } from '../../src/domain/loyalty/linkMissions.js';
import { linkMissionsToTiers as linkMissionsJS } from '../../public/loyalty-missions-link.js';

const BASE_PARAMS = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 6,
  region: 'eu',
  segment: 'mid',
  players: 5000,
  avgdep: 100,
  arpu: 50,
};

const PARAM_VARIANTS = [
  BASE_PARAMS,
  { ...BASE_PARAMS, earnRateDeposit: 5,  missionCount: 3, avgdep: 50  },
  { ...BASE_PARAMS, earnRateDeposit: 20, missionCount: 6, avgdep: 300 },
  { ...BASE_PARAMS, numTiers: 3, missionCount: 2 },
  { ...BASE_PARAMS, missionCount: 1 }, // only "First Deposits" (one_time)
];

const LINK_FIELDS = [
  'tierPointsContribution',
  'monthlyTierPoints',
  'multiplierBoost',
  'boostDurationDays',
  'eligibleTiers',
  'acceleratesUpgrade',
];

describe('loyalty-missions-link.js parity with backend linkMissions.ts', () => {
  PARAM_VARIANTS.forEach((params, idx) => {
    it(`variant ${idx + 1} — all link fields match`, () => {
      const cfg = buildLoyaltyConfig(params);
      // Server result: missions already linked by buildConfig
      const serverMissions = cfg.missions;

      // JS result: link the same raw missions independently
      const rawMissions = serverMissions.map(({ link: _link, ...rest }) => rest);
      const jsMissions  = linkMissionsJS(rawMissions, cfg.tiers, params);

      expect(jsMissions.length).toBe(serverMissions.length);

      serverMissions.forEach((sm, i) => {
        const jm = jsMissions[i];
        LINK_FIELDS.forEach(field => {
          if (field === 'eligibleTiers') {
            expect(jm.link[field]).toEqual(sm.link[field]);
          } else {
            expect(jm.link[field]).toBe(sm.link[field]);
          }
        });
      });
    });
  });
});
