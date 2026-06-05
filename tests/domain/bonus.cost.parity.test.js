// Parity test: recalcCostsLocal (public/bonus-cost.js) must match
// server-side recalcCosts for identical cfg + overrides.
// Includes RUB/KZT/MNT configs to exercise the payout-fallback path.

import { describe, it, expect } from 'vitest';
import { buildConfig }          from '../../src/domain/bonus/buildConfig.js';
import { recalcCosts }          from '../../src/domain/bonus/recalcCosts.js';
import { recalcCostsLocal }     from '../../public/bonus-cost.js';

const CONFIGS = [
  // 1. EU/MGA — EUR, standard multi-bonus suite
  { params: { region: 'eu',    sitecur: 'EUR', depcur: 'EUR', players: 5000, avgdep: 100, plat: 'both', rtp: 96, lic: 'mga'  }, overrides: {} },
  // 2. EU/UKGC — low wager cap, small maxB
  { params: { region: 'eu',    sitecur: 'GBP', depcur: 'GBP', players: 2000, avgdep: 80,  plat: 'both', rtp: 96, lic: 'ukgc' }, overrides: {} },
  // 3. CIS/RUB — large-denomination currency, exercises payout-fallback
  { params: { region: 'cis',   sitecur: 'RUB', depcur: 'RUB', players: 3000, avgdep: 5000, plat: 'mobile', rtp: 95, lic: 'none' }, overrides: {} },
  // 4. KZT — another large-denomination, payout-fallback
  { params: { region: 'cis',   sitecur: 'KZT', depcur: 'KZT', players: 1000, avgdep: 10000, plat: 'both', rtp: 96, lic: 'none' }, overrides: {} },
  // 5. MN/MNT — Mongolia, payout-fallback
  { params: { region: 'mn',    sitecur: 'MNT', depcur: 'MNT', players: 500,  avgdep: 50000, plat: 'mobile', rtp: 96, lic: 'none' }, overrides: {} },
  // 6. EU/MGA with wager override
  { params: { region: 'eu',    sitecur: 'EUR', depcur: 'EUR', players: 5000, avgdep: 100, plat: 'both', rtp: 96, lic: 'mga'  }, overrides: { ov_w_wager: 50, ov_w_pct: 75 } },
];

describe('bonus-cost.js parity with server recalcCosts', () => {
  CONFIGS.forEach(({ params, overrides }, idx) => {
    it(`config ${idx + 1} (${params.region}/${params.sitecur}) — costs.total, ratio, maxRisk match`, () => {
      const cfg = buildConfig(params);

      // Server uses short override keys without 'ov_' prefix
      const serverOv = {};
      for (const [k, v] of Object.entries(overrides)) {
        serverOv[k.replace(/^ov_/, '')] = v;
      }
      const serverResult = recalcCosts(cfg, serverOv);
      const clientResult = recalcCostsLocal(cfg, overrides);

      expect(clientResult.costs.total, 'costs.total').toBeCloseTo(serverResult.costs.total, -1);
      expect(clientResult.costs.w_p50, 'costs.w_p50').toBeCloseTo(serverResult.costs.w_p50, -1);
      expect(clientResult.costs.d2,    'costs.d2').toBeCloseTo(serverResult.costs.d2, -1);
      expect(clientResult.costs.d3,    'costs.d3').toBeCloseTo(serverResult.costs.d3, -1);
      expect(clientResult.ratio,       'ratio').toBeCloseTo(serverResult.ratio, 4);
      expect(clientResult.maxRisk,     'maxRisk').toBeCloseTo(serverResult.maxRisk, -1);
    });
  });
});
