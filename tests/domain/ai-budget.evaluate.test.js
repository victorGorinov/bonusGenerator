import { describe, it, expect } from 'vitest';
import { evaluateAiLimits } from '../../src/domain/ai-budget/evaluate.js';

const base = {
  globalSpend: 0, budget: 20,
  userToday: 0, dailyLimit: 30,
  userTotal: 0, totalLimit: 120,
  hasUser: true,
};

describe('evaluateAiLimits', () => {
  it('allows a normal call under all limits', () => {
    expect(evaluateAiLimits(base)).toEqual({ allowed: true });
  });

  it('blocks with 503 AI_BUDGET_EXCEEDED at/over the global budget', () => {
    expect(evaluateAiLimits({ ...base, globalSpend: 20 })).toMatchObject({ allowed: false, status: 503, code: 'AI_BUDGET_EXCEEDED' });
    expect(evaluateAiLimits({ ...base, globalSpend: 20.5 })).toMatchObject({ code: 'AI_BUDGET_EXCEEDED' });
  });

  it('budget check wins over per-user quota', () => {
    const v = evaluateAiLimits({ ...base, globalSpend: 25, userToday: 999, userTotal: 999 });
    expect(v.code).toBe('AI_BUDGET_EXCEEDED');
  });

  it('blocks with 429 AI_QUOTA_DAILY at/over the daily limit', () => {
    expect(evaluateAiLimits({ ...base, userToday: 30 })).toMatchObject({ allowed: false, status: 429, code: 'AI_QUOTA_DAILY' });
  });

  it('daily check wins over total', () => {
    const v = evaluateAiLimits({ ...base, userToday: 30, userTotal: 120 });
    expect(v.code).toBe('AI_QUOTA_DAILY');
  });

  it('blocks with 429 AI_QUOTA_TOTAL at/over the total limit', () => {
    expect(evaluateAiLimits({ ...base, userTotal: 120 })).toMatchObject({ allowed: false, status: 429, code: 'AI_QUOTA_TOTAL' });
  });

  it('one below each limit is allowed', () => {
    expect(evaluateAiLimits({ ...base, globalSpend: 19.99, userToday: 29, userTotal: 119 })).toEqual({ allowed: true });
  });

  it('skips per-user quotas when there is no user (global budget still applies)', () => {
    // hasUser:false shouldn't happen behind requireFeature('ai'), but is defensive.
    expect(evaluateAiLimits({ ...base, hasUser: false, userToday: 999, userTotal: 999 })).toEqual({ allowed: true });
    expect(evaluateAiLimits({ ...base, hasUser: false, globalSpend: 20 })).toMatchObject({ code: 'AI_BUDGET_EXCEEDED' });
  });
});
