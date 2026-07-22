import { describe, it, expect } from 'vitest';
import { resolveFeatureAccess } from '../../src/domain/auth/access.js';
import { GUEST_FEATURES, FEATURES } from '../../src/config/features.js';

const base = { role: 'user', status: 'active', plan: 'free', features: {} };

describe('resolveFeatureAccess — layered access model', () => {
  it('guest (no row) → GUEST_FEATURES', () => {
    expect(resolveFeatureAccess(undefined)).toEqual(GUEST_FEATURES);
    expect(resolveFeatureAccess(null)).toEqual(GUEST_FEATURES);
  });

  it('disabled user → everything off (overrides plan and role)', () => {
    const acc = resolveFeatureAccess({ ...base, status: 'disabled', features: { bonus: true } });
    for (const f of FEATURES) expect(acc[f]).toBe(false);
  });

  it('admin → everything on (short-circuits even explicit false overrides)', () => {
    const acc = resolveFeatureAccess({ ...base, role: 'admin', features: { bonus: false, reports: false } });
    for (const f of FEATURES) expect(acc[f]).toBe(true);
  });

  it('registered user on free plan with no overrides → full plan preset EXCEPT ai', () => {
    const acc = resolveFeatureAccess(base);
    for (const f of FEATURES) {
      // free == all-on today, EXCEPT `ai`, which registration must never grant.
      expect(acc[f]).toBe(f !== 'ai');
    }
    expect(acc.ai).toBe(false);
  });

  it('ai is granted only via a per-user override (not by registration)', () => {
    expect(resolveFeatureAccess(base).ai).toBe(false);
    expect(resolveFeatureAccess({ ...base, features: { ai: true } }).ai).toBe(true);
  });

  it('admin gets ai on even with no override (short-circuit ALL_ON)', () => {
    expect(resolveFeatureAccess({ ...base, role: 'admin' }).ai).toBe(true);
  });

  it('per-user override wins over the plan preset', () => {
    const acc = resolveFeatureAccess({ ...base, features: { reports: false, loyalty: false } });
    expect(acc.reports).toBe(false);
    expect(acc.loyalty).toBe(false);
    expect(acc.bonus).toBe(true); // untouched → inherits plan
  });

  it('unknown plan falls back to the default preset (free → all-on except ai)', () => {
    const acc = resolveFeatureAccess({ ...base, plan: 'nonexistent' });
    for (const f of FEATURES) expect(acc[f]).toBe(f !== 'ai');
  });

  it('unknown / non-boolean override keys are ignored', () => {
    const acc = resolveFeatureAccess({ ...base, features: { bogus: true, bonus: 'yes' } });
    expect(acc.bonus).toBe(true);   // 'yes' is not a boolean → inherits plan
    expect('bogus' in acc).toBe(false);
  });
});
