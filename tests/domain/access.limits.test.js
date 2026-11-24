import { describe, it, expect } from 'vitest';
import { resolveLimits, limitOf, limitsForWire, UNLIMITED } from '../../src/domain/auth/access.js';
import { PLAN_LIMITS, GUEST_LIMITS } from '../../src/config/features.js';

// Numeric quota resolution — the twin of resolveFeatureAccess. Precedence:
// disabled → admin → per-user override → plan preset → (no row) guest.
const row = (over = {}) => ({ role: 'user', status: 'active', plan: 'free', features: {}, limits: null, ...over });

describe('resolveLimits — precedence', () => {
  it('gives a guest (no row) the guest limits', () => {
    expect(resolveLimits(undefined)).toEqual(GUEST_LIMITS);
    expect(resolveLimits(null).brands).toBe(0);
  });

  it('falls back to the plan preset when there is no override', () => {
    expect(resolveLimits(row({ plan: 'growth' })).brands).toBe(PLAN_LIMITS.growth.brands);
    expect(resolveLimits(row({ plan: 'agency' })).brands).toBe(PLAN_LIMITS.agency.brands);
  });

  it('falls back to the default plan for an unknown plan key', () => {
    expect(resolveLimits(row({ plan: 'nonsense' })).brands).toBe(PLAN_LIMITS.free.brands);
  });

  it('lets a per-user override beat the plan preset in both directions', () => {
    expect(resolveLimits(row({ plan: 'free',   limits: { brands: 7 } })).brands).toBe(7);
    expect(resolveLimits(row({ plan: 'agency', limits: { brands: 2 } })).brands).toBe(2);
    expect(resolveLimits(row({ plan: 'growth', limits: { brands: 0 } })).brands).toBe(0);
  });

  it('zeroes every limit for a disabled account, override or not', () => {
    expect(resolveLimits(row({ status: 'disabled', limits: { brands: 99 } })).brands).toBe(0);
  });

  it('gives an admin an unlimited quota, and disabled still wins over admin', () => {
    expect(resolveLimits(row({ role: 'admin' })).brands).toBe(UNLIMITED);
    expect(resolveLimits(row({ role: 'admin', status: 'disabled' })).brands).toBe(0);
  });
});

describe('resolveLimits — malformed overrides never widen a quota', () => {
  for (const bad of [{ brands: -5 }, { brands: NaN }, { brands: Infinity }, { brands: '10' }, { brands: null }]) {
    it(`ignores ${JSON.stringify(bad)} and keeps the plan value`, () => {
      expect(resolveLimits(row({ plan: 'starter', limits: bad })).brands).toBe(PLAN_LIMITS.starter.brands);
    });
  }

  it('floors a fractional override rather than storing a partial brand', () => {
    expect(resolveLimits(row({ limits: { brands: 3.9 } })).brands).toBe(3);
  });

  it('ignores unknown keys in the override blob', () => {
    const out = resolveLimits(row({ limits: { seats: 12 } }));
    expect(out.seats).toBeUndefined();
    expect(out.brands).toBe(PLAN_LIMITS.free.brands);
  });
});

describe('limitOf / limitsForWire', () => {
  it('limitOf reads a single limit through the same resolution', () => {
    expect(limitOf(row({ plan: 'agency' }), 'brands')).toBe(PLAN_LIMITS.agency.brands);
  });

  it('encodes an unlimited quota as -1 (Infinity is not JSON-representable)', () => {
    const wire = limitsForWire(resolveLimits(row({ role: 'admin' })));
    expect(wire.brands).toBe(-1);
    expect(JSON.parse(JSON.stringify(wire)).brands).toBe(-1);
  });

  it('passes finite quotas through untouched', () => {
    expect(limitsForWire(resolveLimits(row({ plan: 'growth' }))).brands).toBe(PLAN_LIMITS.growth.brands);
  });
});

describe('PLAN_LIMITS mirrors the PRICING.md brand grid', () => {
  it('prices brands per tier: free/starter 1, growth 3, agency 10', () => {
    expect(PLAN_LIMITS.free.brands).toBe(1);
    expect(PLAN_LIMITS.starter.brands).toBe(1);
    expect(PLAN_LIMITS.growth.brands).toBe(3);
    expect(PLAN_LIMITS.agency.brands).toBe(10);
  });

  it('gives a guest no server-side brand at all', () => {
    expect(GUEST_LIMITS.brands).toBe(0);
  });
});
