import { describe, it, expect } from 'vitest';
import { _erf, _phi, _Phi, truncNormalPayout, truncNormalPayoutCapped } from '../../src/domain/bonus/payout.js';
import { currencyScale } from '../../src/domain/shared/fx.js';
import { buildConfig } from '../../src/domain/bonus/buildConfig.js';

describe('_erf', () => {
  it('erf(0) ≈ 0',            () => expect(_erf(0)).toBeCloseTo(0, 8));
  it('erf(1) ≈ 0.843',        () => expect(_erf(1)).toBeCloseTo(0.843, 2));
  it('erf(-x) = -erf(x)',     () => expect(_erf(-1)).toBeCloseTo(-_erf(1), 10));
  it('erf(∞) ≈ 1',            () => expect(_erf(10)).toBeCloseTo(1, 5));
});

describe('_phi', () => {
  it('phi(0) = 1/sqrt(2π)',   () => expect(_phi(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 10));
  it('phi is symmetric',      () => expect(_phi(-1)).toBeCloseTo(_phi(1), 10));
  it('phi(z) > 0',            () => expect(_phi(5)).toBeGreaterThan(0));
});

describe('_Phi', () => {
  it('Phi(0) = 0.5',          () => expect(_Phi(0)).toBeCloseTo(0.5, 5));
  it('Phi(-∞) ≈ 0',           () => expect(_Phi(-10)).toBeCloseTo(0, 5));
  it('Phi(+∞) ≈ 1',           () => expect(_Phi(10)).toBeCloseTo(1, 5));
});

describe('truncNormalPayout', () => {
  it('returns 0 when B = 0',  () => expect(truncNormalPayout(0, 35, 1, 0.96)).toBe(0));
  it('returns 0 when W = 0',  () => expect(truncNormalPayout(100, 0, 1, 0.96)).toBe(0));

  it('returns positive for valid inputs', () => {
    expect(truncNormalPayout(100, 35, 1, 0.96)).toBeGreaterThan(0);
  });

  it('payout ≤ bonus size', () => {
    expect(truncNormalPayout(100, 35, 1, 0.96)).toBeLessThanOrEqual(100);
  });

  it('higher wager → lower payout', () => {
    const low  = truncNormalPayout(100, 20, 1, 0.96);
    const high = truncNormalPayout(100, 50, 1, 0.96);
    expect(low).toBeGreaterThan(high);
  });

  it('higher RTP → higher payout', () => {
    const low  = truncNormalPayout(100, 35, 1, 0.93);
    const high = truncNormalPayout(100, 35, 1, 0.97);
    expect(high).toBeGreaterThan(low);
  });

  // Below-breakeven regime (W=10 < be≈25): larger bonus → larger payout
  it('larger bonus → larger payout (below-breakeven wager)', () => {
    const small = truncNormalPayout(50,  10, 1, 0.96);
    const large = truncNormalPayout(200, 10, 1, 0.96);
    expect(large).toBeGreaterThan(small);
  });

  // Over-breakeven regime (W=35 > be≈25): payout can be lower for larger bonus
  it('over-breakeven: payout is non-zero despite high wager', () => {
    expect(truncNormalPayout(100, 35, 1, 0.96)).toBeGreaterThan(0);
  });
});

// ── Currency-scale invariance ────────────────────────────────────────────────
//
// Regression guard for the defect where the same economic bonus produced a 17.4%
// payout ratio in EUR, 20.2% in GBP and ~0% in RUB/KZT/MNT: mu grows linearly with
// B while sigma grows as √B, so an unnormalised site-currency amount made the ratio
// depend on the currency's denomination.
describe('truncNormalPayout — currency scale', () => {
  const W = 35, WCR = 0.625, RTP = 0.9705;
  const USD_BONUS = 54.35;
  const CURRENCIES = ['USD', 'EUR', 'GBP', 'DKK', 'RUB', 'KZT', 'MNT'];

  const ratioFor = (cur) => {
    const scale = currencyScale(cur);
    const B = USD_BONUS * scale;
    return truncNormalPayout(B, W, WCR, RTP, scale) / B;
  };

  it('payout ratio is identical across every currency', () => {
    const ratios = CURRENCIES.map(ratioFor);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 10);
  });

  it('ratio is a sane fraction, not zero and not the whole bonus', () => {
    const r = ratioFor('RUB');
    expect(r).toBeGreaterThan(0.05);
    expect(r).toBeLessThan(0.50);
  });

  it('large-denomination currencies no longer underflow to zero', () => {
    for (const cur of ['RUB', 'KZT', 'MNT']) {
      const scale = currencyScale(cur);
      expect(truncNormalPayout(USD_BONUS * scale, W, WCR, RTP, scale)).toBeGreaterThan(0);
    }
  });

  it('never exceeds the bonus, even when the bonus is tiny next to one bet', () => {
    const scale = currencyScale('RUB');
    expect(truncNormalPayout(100, 40, 0.875, 0.964, scale)).toBeLessThanOrEqual(100);
  });

  it('unknown currency falls back to USD scale', () => {
    expect(currencyScale('ZZZ')).toBe(1);
    expect(truncNormalPayout(50, W, WCR, RTP, currencyScale('ZZZ')))
      .toBe(truncNormalPayout(50, W, WCR, RTP, 1));
  });

  it('every scenario cost is non-zero for a realistic RUB config', () => {
    const cfg = buildConfig({ region: 'cis', sitecur: 'RUB', depcur: 'RUB', avgdep: 3000, players: 1000, plat: 'both', rtp: 96 });
    for (const s of ['sP10', 'sP50', 'sP90']) expect(cfg.econ[s].cost).toBeGreaterThan(0);
    // …and monotonically increasing with the conversion cohort.
    expect(cfg.econ.sP90.cost).toBeGreaterThan(cfg.econ.sP50.cost);
    expect(cfg.econ.sP50.cost).toBeGreaterThan(cfg.econ.sP10.cost);
  });
});

// ── Max-win cap ──────────────────────────────────────────────────────────────
//
// The cap truncates the upper tail, so it must bite even when set well ABOVE the
// mean payout. The previous implementation clamped the already-averaged value, which
// made every realistically-sized cap a no-op.
describe('truncNormalPayoutCapped', () => {
  const B = 50, W = 35, WCR = 0.625, RTP = 0.9705;
  const uncapped = truncNormalPayout(B, W, WCR, RTP);

  it('a cap above the mean payout still lowers the expected cost', () => {
    expect(uncapped).toBeLessThan(3 * B);                       // cap sits above the mean…
    expect(truncNormalPayoutCapped(B, W, WCR, RTP, 3 * B)).toBeLessThan(uncapped); // …and still binds
  });

  it('tighter caps cost strictly less', () => {
    const loose  = truncNormalPayoutCapped(B, W, WCR, RTP, 5 * B);
    const medium = truncNormalPayoutCapped(B, W, WCR, RTP, 2 * B);
    const tight  = truncNormalPayoutCapped(B, W, WCR, RTP, 0.5 * B);
    expect(medium).toBeLessThan(loose);
    expect(tight).toBeLessThan(medium);
  });

  it('never exceeds the cap', () => {
    for (const c of [1, 10, 25]) expect(truncNormalPayoutCapped(B, W, WCR, RTP, c)).toBeLessThanOrEqual(c);
  });

  it('a zero/absent cap matches the uncapped payout', () => {
    expect(truncNormalPayoutCapped(B, W, WCR, RTP, 0)).toBe(uncapped);
  });

  it('an enormous cap converges to the uncapped payout', () => {
    expect(truncNormalPayoutCapped(B, W, WCR, RTP, 1e9)).toBeCloseTo(uncapped, 6);
  });

  it('scales with currency exactly like the uncapped model', () => {
    const scale = currencyScale('RUB');
    const capped = truncNormalPayoutCapped(B * scale, W, WCR, RTP, 3 * B * scale, scale);
    expect(capped / (B * scale)).toBeCloseTo(truncNormalPayoutCapped(B, W, WCR, RTP, 3 * B) / B, 10);
  });
});
