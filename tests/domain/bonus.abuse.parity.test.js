// Parity: public/bonus-abuse.js must match src/domain/bonus/abuseRisk.ts.
import { describe, it, expect } from 'vitest';
import { assessBonusAbuse as srv } from '../../src/domain/bonus/abuseRisk.js';
import { assessBonusAbuse as cli } from '../../public/bonus-abuse.js';

const CASES = [];
for (const wagerX of [0, 20, 24, 27, 35, 50]) {
  for (const be of [20, 25, 30]) {
    for (const r of ['eu', 'sweep', 'cis']) {
      for (const contribPct of [0, 30, 100]) {
        CASES.push({
          r,
          econ: { breakeven_wager: be, wagerX, bonusSize: 100 },
          welcome: { pct: 200, minD: 5 },
          ndb: { type: 'combined', amt: 10, maxW_x: 20, trigger: 'none' },
          cashback: { pct: 10 },
          contrib: [{ game: 'Slots', pct: 100 }, { game: 'Live Casino', pct: contribPct }],
        });
      }
    }
  }
}
const OPTS = [undefined, { activeTypes: ['welcome'] }, { activeTypes: ['welcome', 'ndb', 'cashback'] }];

describe('bonus-abuse.js parity with abuseRisk.ts', () => {
  it('matches across the full input × opts matrix', () => {
    for (const c of CASES) {
      for (const o of OPTS) {
        expect(cli(c, o), JSON.stringify({ c, o })).toEqual(srv(c, o));
      }
    }
  });
});
