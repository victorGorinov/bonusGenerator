import { describe, it, expect } from 'vitest';
import { _erf, _phi, _Phi, truncNormalPayout } from '../../src/domain/bonus/payout.js';

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
