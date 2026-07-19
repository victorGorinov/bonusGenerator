// A3: the wager rationale must be honest — no "optimal"/"Truncated Normal" over-claim,
// and it should surface the recommended benchmark range instead.

import { describe, it, expect } from 'vitest';
import { campaignExplanation } from '../../src/domain/campaign/explanation.js';

const cfg = { lic: 'mga', r: 'eu', wager: { wW: 35 } };

describe('campaignExplanation — honest wager copy (A3)', () => {
  for (const lang of ['en', 'ru']) {
    it(`[${lang}] no "optimal"/"Truncated Normal" over-claim in the wager line`, () => {
      const lines = campaignExplanation('inactive_7', 'welcome', cfg, [], lang);
      const joined = lines.join(' | ');
      expect(joined).not.toMatch(/optimal/i);
      expect(joined).not.toMatch(/Truncated Normal/i);
      expect(joined).not.toMatch(/оптимальный баланс/i);
    });

    it(`[${lang}] surfaces baseline + recommended range`, () => {
      const lines = campaignExplanation('inactive_7', 'welcome', cfg, [], lang);
      const wagerLine = lines.find(l => /35/.test(l) && /(baseline)/i.test(l));
      expect(wagerLine, 'a baseline wager line exists').toBeTruthy();
      // EU/MGA welcome wager band is 20–45×
      expect(wagerLine).toMatch(/20–45×/);
    });
  }
});
