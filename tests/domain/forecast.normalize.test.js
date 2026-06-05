import { describe, it, expect } from 'vitest';
import { normalizeCampaign } from '../../src/domain/forecast/normalizeCampaign.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function base(overrides = {}) {
  return {
    id: 'c1', title: 'Test', type: 'reload', segment: 'all',
    startDate: '2026-06-01', endDate: '2026-06-07',
    ...overrides,
  };
}

// ── tournament_generator ──────────────────────────────────────────────────────

describe('normalizeCampaign — tournament_generator', () => {
  it('extracts ggrLiftMid / prizePoolCost / eligible', () => {
    const c = base({
      sourceType: 'tournament_generator',
      type: 'tournament', segment: 'vip',
      econ: { ggrLiftMid: 8000, prizePoolCost: 3000, eligible: 500,
              segmentRatio: 0.10, totalPlayers: 5000 },
    });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(true);
    expect(a.incrementalRevenue).toBe(8000);
    expect(a.cost).toBe(3000);
    expect(a.eligiblePlayers).toBe(500);
  });

  it('handles missing econ fields with fallback 0', () => {
    const c = base({ sourceType: 'tournament_generator', econ: {} });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(false);
    expect(a.incrementalRevenue).toBe(0);
    expect(a.cost).toBe(0);
  });
});

// ── campaign_generator ────────────────────────────────────────────────────────

describe('normalizeCampaign — campaign_generator', () => {
  it('scales monthly budget×roi by days/30', () => {
    // 7-day campaign, mBudget=6000, roi3=50 → monthlyRev=3000 → 7/30 ≈ 700
    const c = base({
      sourceType: 'campaign_generator',
      segment: 'all',
      startDate: '2026-06-01', endDate: '2026-06-07', // 7 days
      econ: { mBudget: 6000, roi3: 50, pl: 1000 },
    });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(true);
    expect(a.incrementalRevenue).toBe(Math.round(3000 * 7 / 30));
    expect(a.cost).toBe(Math.round(6000 * 7 / 30));
    expect(a.eligiblePlayers).toBe(1000); // all × 1.0
  });

  it('applies SEGMENT_RATIO to eligiblePlayers for non-all segment', () => {
    const c = base({
      sourceType: 'campaign_generator',
      segment: 'vip',
      econ: { mBudget: 3000, roi3: 30, pl: 2000 },
    });
    const a = normalizeCampaign(c);
    expect(a.eligiblePlayers).toBe(Math.round(2000 * 0.10)); // vip=0.10
  });

  it('handles zero roi3 (no profit scenario) — hasEcon based on cost', () => {
    const c = base({
      sourceType: 'campaign_generator',
      econ: { mBudget: 5000, roi3: 0, pl: 500 },
    });
    const a = normalizeCampaign(c);
    expect(a.incrementalRevenue).toBe(0);
    expect(a.cost).toBeGreaterThan(0); // cost still present
    expect(a.hasEcon).toBe(true);
  });

  it('handles missing econ fields without throwing', () => {
    const c = base({ sourceType: 'campaign_generator', econ: {} });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(false);
    expect(a.incrementalRevenue).toBe(0);
  });
});

// ── loyalty_generator ─────────────────────────────────────────────────────────

describe('normalizeCampaign — loyalty_generator', () => {
  it('scales additionalRevenue3m/3 × days/30', () => {
    // 30-day campaign, additionalRevenue3m=9000 → monthly=3000 → 30/30=1.0 → 3000
    const c = base({
      sourceType: 'loyalty_generator',
      type: 'vip', segment: 'vip',
      startDate: '2026-06-01', endDate: '2026-06-30', // 30 days
      econ: { additionalRevenue3m: 9000, monthlyCostUSD: 2000 },
    });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(true);
    expect(a.incrementalRevenue).toBe(3000);
    expect(a.cost).toBe(2000);
    expect(a.eligiblePlayers).toBe(0); // not stored in econ snapshot
  });

  it('handles missing fields without throwing', () => {
    const c = base({ sourceType: 'loyalty_generator', econ: {} });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(false);
    expect(a.incrementalRevenue).toBe(0);
  });
});

// ── econ == null ──────────────────────────────────────────────────────────────

describe('normalizeCampaign — no econ', () => {
  it('econ null → hasEcon=false, revenue/cost=0', () => {
    const c = base({ sourceType: 'manual', econ: null });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(false);
    expect(a.incrementalRevenue).toBe(0);
    expect(a.cost).toBe(0);
  });

  it('manual with econ → hasEcon=false (unknown schema)', () => {
    const c = base({ sourceType: 'manual', econ: { revenue: 999, cost: 500 } });
    const a = normalizeCampaign(c);
    expect(a.hasEcon).toBe(false);
  });

  it('missing startDate → returns null', () => {
    const c = { id: 'x', sourceType: 'manual', econ: null };
    expect(normalizeCampaign(c)).toBeNull();
  });
});
