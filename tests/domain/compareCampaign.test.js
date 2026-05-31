import { describe, it, expect } from 'vitest';
import { compareCampaign } from '../../src/domain/analytics/compareCampaign.ts';

const baseSnapshot = {
  capturedAt: '2026-05-29T10:00:00Z',
  geo: 'de',
  segment: 'mid',
  lic: 'mga',
  cur: 'EUR',
  pl: 5000,
  costRatio: 0.12,
  sP10: 200,
  sP50: 500,
  sP90: 900,
  conv: { p10: 0.10, p50: 0.20, p90: 0.40 },
  lift: 0.18,
  incrPl: 900,
  incrRev: 2000,  // USD
  campCost3: 1200, // USD
  net: 800,       // USD
};

const baseActuals = {
  enteredAt: '2026-06-15T14:30:00Z',
  source: 'manual',
  participants: 450,
  totalDeposits: 4000,
  wagerCompleted: 0.19,
  bonusPayout: 520,
  incrRevenue: 1900,
};

describe('compareCampaign', () => {
  // ── Percentile classification ──
  it('classifies actual below P10', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 150,
    });
    expect(result.percentile).toBe('below_p10');
    expect(result.withinBand).toBe(false);
    expect(result.flags).toContain('better_than_best_case');
  });

  it('classifies actual in P10–P50 band', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 350,
    });
    expect(result.percentile).toBe('p10_p50');
    expect(result.withinBand).toBe(true);
  });

  it('classifies actual in P50–P90 band', () => {
    const result = compareCampaign(baseSnapshot, baseActuals);
    expect(result.percentile).toBe('p50_p90');
    expect(result.withinBand).toBe(true);
  });

  it('classifies actual above P90', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 1000,
    });
    expect(result.percentile).toBe('above_p90');
    expect(result.withinBand).toBe(false);
    expect(result.flags).toContain('worse_than_worst_case');
  });

  // ── Boundary conditions ──
  it('classifies exactly at P10 as within band', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 200,
    });
    expect(result.withinBand).toBe(true);
    expect(result.percentile).toBe('p10_p50');
  });

  it('classifies exactly at P90 as within band', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 900,
    });
    expect(result.withinBand).toBe(true);
    expect(result.percentile).toBe('p50_p90');
  });

  // ── Cost variance ──
  it('calculates cost variance correctly', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 550,
    });
    expect(result.forecastCostP50).toBe(500);
    expect(result.actualCost).toBe(550);
    expect(result.costVarianceAbs).toBe(50);
    expect(result.costVariancePct).toBeCloseTo(10, 1); // 10%
  });

  it('calculates negative cost variance', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 450,
    });
    expect(result.costVarianceAbs).toBe(-50);
    expect(result.costVariancePct).toBeCloseTo(-10, 1);
  });

  // ── Cost ratio ──
  it('calculates cost ratio correctly', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 480,
      totalDeposits: 4000,
    });
    expect(result.forecastRatio).toBe(0.12);
    expect(result.actualRatio).toBeCloseTo(0.12, 2);
    expect(result.ratioVariancePct).toBeCloseTo(0, 1);
  });

  it('handles zero totalDeposits (guards division by zero)', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      totalDeposits: 0,
    });
    expect(result.actualRatio).toBe(0);
    expect(result.ratioVariancePct).toBeCloseTo(-100, 0); // Ratio dropped to 0
  });

  // ── Wager completion ──
  it('calculates wager completion variance', () => {
    const result = compareCampaign(baseSnapshot, baseActuals);
    expect(result.forecastConvP50).toBe(0.20);
    expect(result.actualWagerCompl).toBe(0.19);
    expect(result.convVariancePct).toBeCloseTo(-5, 0); // -5%
  });

  // ── ROI (USD) ──
  it('calculates actual ROI correctly', () => {
    const result = compareCampaign(baseSnapshot, baseActuals);
    // actualNet = 1900 - 1200 = 700
    // roiActual = (700 / 1200) * 100 = 58.33%
    expect(result.actualNet).toBe(700);
    expect(result.roiActual).toBeCloseTo(58.33, 1);
  });

  it('calculates net variance (USD)', () => {
    const result = compareCampaign(baseSnapshot, baseActuals);
    // forecastNet = 800, actualNet = 700
    expect(result.forecastNet).toBe(800);
    expect(result.netVarianceAbs).toBe(-100);
  });

  // ── Flags ──
  it('flags abuse when wager completion is very low', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      wagerCompleted: 0.08, // < 0.5 * 0.20 = 0.10
      bonusPayout: 600,
      totalDeposits: 4000,
    });
    expect(result.flags).toContain('abuse_suspected');
  });

  it('does not flag abuse with low wager but low cost ratio', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      wagerCompleted: 0.08,
      bonusPayout: 300, // Cost ratio = 0.075, not > 0.12 * 1.2
      totalDeposits: 4000,
    });
    expect(result.flags).not.toContain('abuse_suspected');
  });

  it('flags data_incomplete when participants is zero', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      participants: 0,
    });
    expect(result.flags).toContain('data_incomplete');
  });

  it('flags data_incomplete when totalDeposits is zero', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      totalDeposits: 0,
    });
    expect(result.flags).toContain('data_incomplete');
  });

  it('flags data_incomplete when wagerCompleted is zero', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      wagerCompleted: 0,
    });
    expect(result.flags).toContain('data_incomplete');
  });

  it('flags data_incomplete when bonusPayout is zero', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      bonusPayout: 0,
    });
    expect(result.flags).toContain('data_incomplete');
  });

  // ── Currency separation ──
  it('keeps sitecur costs separate from USD net', () => {
    const result = compareCampaign(baseSnapshot, baseActuals);
    // Cost fields should be in sitecur (EUR)
    expect(result.actualCost).toBe(520); // EUR
    expect(result.actualRatio).toBeCloseTo(0.13, 2); // EUR/EUR
    // Net should be in USD
    expect(result.actualNet).toBe(700); // USD
  });

  // ── Optional fields ──
  it('handles missing incrRevenue (defaults to 0)', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      incrRevenue: undefined,
    });
    expect(result.actualNet).toBe(0 - 1200); // -1200 USD (negative ROI)
  });

  it('handles missing incrPlayers gracefully', () => {
    const result = compareCampaign(baseSnapshot, {
      ...baseActuals,
      incrPlayers: undefined,
    });
    // Should not crash; incrPlayers is for future use
    expect(result).toBeDefined();
  });
});
