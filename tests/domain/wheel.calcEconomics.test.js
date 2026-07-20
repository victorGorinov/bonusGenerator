import { describe, it, expect } from 'vitest';
import { buildWheel, segmentCost, wheelExpectedValue, wheelTopPrizeCost } from '../../src/domain/wheel/buildWheel.js';
import { calcWheelEconomics } from '../../src/domain/wheel/calcEconomics.js';
import { WHEEL_PRESETS } from '../../src/domain/wheel/presets.js';

const CTX = { avgDeposit: 100, betValue: 0.2, wager: 30, wcr: 1.0, rtp: 0.96 };

describe('buildWheel', () => {
  it('materializes preset segments with concrete prize values', () => {
    const spec = buildWheel({ preset: 'welcome', avgDeposit: 100 });
    expect(spec.preset).toBe('welcome');
    expect(spec.frequency).toBe('on_deposit');
    expect(spec.segments.length).toBe(WHEEL_PRESETS.welcome.segments.length);
    // bonus_money 0.5× → 50, jackpot 5× → 500
    const bm = spec.segments.find(s => s.prizeType === 'bonus_money' && s.weight === 25);
    expect(bm.prizeValue).toBe(50);
    const jp = spec.segments.find(s => s.prizeType === 'jackpot');
    expect(jp.prizeValue).toBe(500);
  });

  it('falls back to welcome for an unknown preset', () => {
    const spec = buildWheel({ preset: 'nope', avgDeposit: 100 });
    expect(spec.preset).toBe('welcome');
  });

  it('honours user-tweaked segments and an explicit frequency', () => {
    const custom = [{ labelKey: 'x', prizeType: 'free_spins', weight: 100, prizeValue: 10 }];
    const spec = buildWheel({ preset: 'daily', avgDeposit: 100, frequency: 'weekly', segments: custom });
    expect(spec.segments).toBe(custom);
    expect(spec.frequency).toBe('weekly');
  });
});

describe('segmentCost', () => {
  it('is zero for the empty segment', () => {
    expect(segmentCost({ prizeType: 'nothing', prizeValue: 0, weight: 1 }, CTX)).toBe(0);
  });
  it('scales free spins by bet × RTP', () => {
    const c = segmentCost({ prizeType: 'free_spins', prizeValue: 50, weight: 1 }, CTX);
    expect(c).toBeCloseTo(50 * 0.2 * 0.96, 6);
  });
  it('returns cashback as fraction × avgDeposit', () => {
    const c = segmentCost({ prizeType: 'cashback', prizeValue: 0.1, weight: 1 }, CTX);
    expect(c).toBeCloseTo(10, 6);
  });
  it('bonus money costs less than face value (wagering discount)', () => {
    const c = segmentCost({ prizeType: 'bonus_money', prizeValue: 100, weight: 1 }, CTX);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(100);
  });
  it('passes jackpot through at nominal', () => {
    expect(segmentCost({ prizeType: 'jackpot', prizeValue: 500, weight: 1 }, CTX)).toBe(500);
  });
});

describe('wheelExpectedValue', () => {
  it('is the weighted average of segment costs', () => {
    const segs = [
      { prizeType: 'nothing', prizeValue: 0, weight: 50 },
      { prizeType: 'cashback', prizeValue: 0.1, weight: 50 }, // cost 10
    ];
    expect(wheelExpectedValue(segs, CTX)).toBeCloseTo(5, 6); // 0.5×0 + 0.5×10
  });
  it('is 0 when total weight is 0', () => {
    expect(wheelExpectedValue([{ prizeType: 'cashback', prizeValue: 0.1, weight: 0 }], CTX)).toBe(0);
  });
  it('normalizes regardless of weight scale', () => {
    const a = [{ prizeType: 'cashback', prizeValue: 0.1, weight: 1 }, { prizeType: 'nothing', prizeValue: 0, weight: 1 }];
    const b = [{ prizeType: 'cashback', prizeValue: 0.1, weight: 100 }, { prizeType: 'nothing', prizeValue: 0, weight: 100 }];
    expect(wheelExpectedValue(a, CTX)).toBeCloseTo(wheelExpectedValue(b, CTX), 6);
  });
});

describe('wheelTopPrizeCost', () => {
  it('returns the most expensive segment cost', () => {
    const spec = buildWheel({ preset: 'vip', avgDeposit: 100 });
    const top = wheelTopPrizeCost(spec.segments, CTX);
    for (const s of spec.segments) expect(top).toBeGreaterThanOrEqual(segmentCost(s, CTX));
  });
});

describe('calcWheelEconomics', () => {
  const base = () => {
    const spec = buildWheel({ preset: 'daily', avgDeposit: 100 });
    return calcWheelEconomics({
      region: 'eu', segment: 'depositors', players: 5000, avgDeposit: 100,
      segments: spec.segments, frequency: spec.frequency, sitecur: 'EUR', geo: 'de',
    });
  };

  it('produces coherent scenario ordering', () => {
    const e = base();
    expect(e.participantsLow).toBeLessThanOrEqual(e.participantsMid);
    expect(e.participantsMid).toBeLessThanOrEqual(e.participantsHigh);
    expect(e.programCostLow).toBeLessThanOrEqual(e.programCostMid);
    expect(e.programCostMid).toBeLessThanOrEqual(e.programCostHigh);
  });

  it('derives eligible from the segment ratio', () => {
    const e = base();
    expect(e.eligible).toBe(Math.round(5000 * 0.60)); // depositors ratio
  });

  it('net result = totalValue − programCost', () => {
    const e = base();
    expect(e.netResultMid).toBe(e.totalValueMid - e.programCostMid);
    expect(e.totalValueMid).toBe(e.ggrUpliftMid + e.retentionValue);
  });

  it('maxRisk includes one top-prize hit above program cost', () => {
    const e = base();
    expect(e.maxRisk).toBeGreaterThanOrEqual(e.programCostMid);
  });

  it('handles zero participants without dividing by zero', () => {
    const spec = buildWheel({ preset: 'daily', avgDeposit: 100 });
    const e = calcWheelEconomics({
      region: 'eu', segment: 'depositors', players: 100, avgDeposit: 100,
      segments: spec.segments, frequency: spec.frequency, sitecur: 'EUR', geo: 'de',
    });
    expect(Number.isFinite(e.costPerActiveMid)).toBe(true);
    expect(Number.isFinite(e.roi)).toBe(true);
  });
});
