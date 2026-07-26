import { describe, it, expect } from 'vitest';
import { assessBonusAbuse } from '../../src/domain/bonus/abuseRisk.js';
import { buildConfig } from '../../src/domain/bonus/buildConfig.js';

// Minimal cfg factory — only the fields the engine reads.
function cfg(over = {}) {
  return {
    r: 'eu',
    econ: { breakeven_wager: 25, wagerX: 35, bonusSize: 100, ...(over.econ || {}) },
    welcome: { pct: 100, minD: 20, ...(over.welcome || {}) },
    ndb: null,
    cashback: null,
    contrib: [{ game: 'Slots', pct: 100 }, { game: 'Live Casino', pct: 0 }],
    ...over,
  };
}
const keys = (a) => a.vectors.map((v) => v.key);
const find = (a, k) => a.vectors.find((v) => v.key === k);

describe('assessBonusAbuse — EV-positive anchor', () => {
  it('flags critical when wager is well below breakeven', () => {
    const a = assessBonusAbuse(cfg({ econ: { breakeven_wager: 25, wagerX: 20, bonusSize: 100 } }));
    const ev = find(a, 'ev_positive');
    expect(ev.severity).toBe('critical');
    expect(a.level).toBe('critical');
  });

  it('flags high when wager just below breakeven', () => {
    const a = assessBonusAbuse(cfg({ econ: { breakeven_wager: 25, wagerX: 24, bonusSize: 100 } }));
    expect(find(a, 'ev_positive').severity).toBe('high');
  });

  it('flags thin-margin warn just above breakeven', () => {
    const a = assessBonusAbuse(cfg({ econ: { breakeven_wager: 25, wagerX: 27, bonusSize: 100 } }));
    expect(find(a, 'ev_thin_margin').severity).toBe('warn');
    expect(find(a, 'ev_positive')).toBeUndefined();
  });

  it('does not flag EV when wager comfortably above breakeven', () => {
    const a = assessBonusAbuse(cfg({ econ: { breakeven_wager: 25, wagerX: 40, bonusSize: 100 } }));
    expect(find(a, 'ev_positive')).toBeUndefined();
    expect(find(a, 'ev_thin_margin')).toBeUndefined();
  });

  it('flags critical when no wagering requirement on a cashable bonus', () => {
    const a = assessBonusAbuse(cfg({ econ: { breakeven_wager: 25, wagerX: 0, bonusSize: 100 } }));
    expect(find(a, 'ev_positive').severity).toBe('critical');
  });

  it('skips the EV loop entirely for sweeps (wagerX 0 is expected)', () => {
    const a = assessBonusAbuse(cfg({ r: 'sweep', econ: { breakeven_wager: 25, wagerX: 0, bonusSize: 50 } }));
    expect(find(a, 'ev_positive')).toBeUndefined();
    expect(find(a, 'no_maxbet')).toBeUndefined();
  });
});

describe('assessBonusAbuse — structural vectors', () => {
  it('flags low-variance contribution clearing (high at ≥50, warn at ≥20)', () => {
    const high = assessBonusAbuse(cfg({ contrib: [{ game: 'Live Casino', pct: 100 }] }));
    expect(find(high, 'low_contrib_clearing').severity).toBe('high');
    const warn = assessBonusAbuse(cfg({ contrib: [{ game: 'Table Games', pct: 30 }] }));
    expect(find(warn, 'low_contrib_clearing').severity).toBe('warn');
    const none = assessBonusAbuse(cfg({ contrib: [{ game: 'Slots', pct: 100 }, { game: 'Live Casino', pct: 0 }] }));
    expect(find(none, 'low_contrib_clearing')).toBeUndefined();
  });

  it('flags cheap-farm when bonus is ≥20× the min deposit', () => {
    const a = assessBonusAbuse(cfg({ welcome: { pct: 100, minD: 5 }, econ: { breakeven_wager: 25, wagerX: 35, bonusSize: 200 } }));
    expect(find(a, 'cheap_farm_mind').severity).toBe('warn');
  });

  it('flags NDB missing KYC gate as high, and unbounded max win', () => {
    const a = assessBonusAbuse(cfg({ ndb: { type: 'combined', amt: 10, trigger: 'none' } }));
    expect(find(a, 'ndb_no_kyc').severity).toBe('high');
    expect(find(a, 'ndb_unbounded').severity).toBe('warn');
  });

  it('does not flag NDB when it carries maxW_x ≤ 10 and KYC gate', () => {
    const a = assessBonusAbuse(cfg({ ndb: { type: 'combined', amt: 10, maxW_x: 5, trigger: 'v_reg_verify' } }));
    expect(find(a, 'ndb_unbounded')).toBeUndefined();
    expect(find(a, 'ndb_no_kyc')).toBeUndefined();
  });

  it('emits no_maxwin as info on a safe config, warn when EV is triggered', () => {
    const safe = assessBonusAbuse(cfg());
    expect(find(safe, 'no_maxwin').severity).toBe('info');
    const risky = assessBonusAbuse(cfg({ econ: { breakeven_wager: 25, wagerX: 20, bonusSize: 100 } }));
    expect(find(risky, 'no_maxwin').severity).toBe('warn');
  });

  it('respects activeTypes gating for NDB/cashback', () => {
    const a = assessBonusAbuse(cfg({ ndb: { type: 'combined', amt: 10, trigger: 'none' }, cashback: { pct: 10 } }), { activeTypes: ['welcome'] });
    expect(find(a, 'ndb_no_kyc')).toBeUndefined();
    expect(find(a, 'cashback_hedge')).toBeUndefined();
  });
});

describe('assessBonusAbuse — buildConfig integration', () => {
  it('produces a coherent assessment for a real EU/mga config', () => {
    const c = buildConfig({ region: 'eu', lic: 'mga', sitecur: 'EUR', depcur: 'EUR', players: 1000, avgdep: 50, plat: 'both', rtp: 96 });
    const a = assessBonusAbuse(c);
    expect(a).toHaveProperty('score');
    expect(a).toHaveProperty('level');
    expect(Array.isArray(a.vectors)).toBe(true);
    // Vectors must be sorted most-severe first.
    const order = { critical: 3, high: 2, warn: 1, info: 0 };
    for (let i = 1; i < a.vectors.length; i++) {
      expect(order[a.vectors[i - 1].severity]).toBeGreaterThanOrEqual(order[a.vectors[i].severity]);
    }
  });
});
