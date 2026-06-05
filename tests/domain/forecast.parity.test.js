/**
 * Parity test: public/forecast.js ↔ backend src/domain/forecast/
 * Both must produce identical Forecast for the same inputs.
 */

import { describe, it, expect } from 'vitest';
import { aggregateForecast as backendAggregate } from '../../src/domain/forecast/aggregateForecast.js';
import { aggregateForecast as clientAggregate }  from '../../public/forecast.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

const tournamentCamp = {
  id: 'tg1', title: 'Weekly Slot Tournament', type: 'tournament', segment: 'all',
  startDate: '2026-06-02', endDate: '2026-06-08',
  sourceType: 'tournament_generator',
  econ: { ggrLiftMid: 8400, prizePoolCost: 3000, eligible: 600, segmentRatio: 1.0, totalPlayers: 600 },
};

const campaignCamp = {
  id: 'cg1', title: 'EU Reload May', type: 'reload', segment: 'vip',
  startDate: '2026-06-01', endDate: '2026-06-14',
  sourceType: 'campaign_generator',
  econ: { mBudget: 9000, roi3: 60, pl: 800, arpu: 65, ltv3: 195 },
};

const loyaltyCamp = {
  id: 'ly1', title: 'VIP Tiers', type: 'vip', segment: 'vip',
  startDate: '2026-06-01', endDate: '2026-06-30',
  sourceType: 'loyalty_generator',
  econ: { additionalRevenue3m: 12000, monthlyCostUSD: 3500 },
};

const noEconCamp = {
  id: 'me1', title: 'Manual promo', type: 'cashback', segment: 'dormant',
  startDate: '2026-06-10', endDate: '2026-06-16',
  sourceType: 'manual', econ: null,
};

const allCamps = [tournamentCamp, campaignCamp, loyaltyCamp, noEconCamp];
const PERIOD   = ['2026-06-01', '2026-06-30'];

// ── parity checks ─────────────────────────────────────────────────────────────

function compare(camps, start, end) {
  const backend = backendAggregate(camps, start, end);
  const client  = clientAggregate(camps, start, end);
  return { backend, client };
}

describe('forecast.js ↔ backend parity', () => {
  it('top-level numbers match', () => {
    const { backend, client } = compare(allCamps, PERIOD[0], PERIOD[1]);
    expect(client.gross).toBe(backend.gross);
    expect(client.grossCost).toBe(backend.grossCost);
    expect(client.overlapLoss).toBe(backend.overlapLoss);
    expect(client.net).toBe(backend.net);
    expect(client.netProfit).toBe(backend.netProfit);
  });

  it('coverage counts match', () => {
    const { backend, client } = compare(allCamps, PERIOD[0], PERIOD[1]);
    expect(client.coverage).toEqual(backend.coverage);
  });

  it('pairs count and losses match', () => {
    const { backend, client } = compare(allCamps, PERIOD[0], PERIOD[1]);
    expect(client.pairs.length).toBe(backend.pairs.length);
    for (let i = 0; i < backend.pairs.length; i++) {
      expect(client.pairs[i].loss).toBe(backend.pairs[i].loss);
      expect(client.pairs[i].aId).toBe(backend.pairs[i].aId);
      expect(client.pairs[i].bId).toBe(backend.pairs[i].bId);
    }
  });

  it('byDay length and dates match', () => {
    const { backend, client } = compare(allCamps, PERIOD[0], PERIOD[1]);
    expect(client.byDay.length).toBe(backend.byDay.length);
    for (let i = 0; i < backend.byDay.length; i++) {
      expect(client.byDay[i].date).toBe(backend.byDay[i].date);
      expect(client.byDay[i].grossRevenue).toBe(backend.byDay[i].grossRevenue);
      expect(client.byDay[i].overlapLoss).toBe(backend.byDay[i].overlapLoss);
      expect(client.byDay[i].netRevenue).toBe(backend.byDay[i].netRevenue);
    }
  });

  it('empty input → identical zeros', () => {
    const { backend, client } = compare([], PERIOD[0], PERIOD[1]);
    expect(client.gross).toBe(backend.gross);
    expect(client.overlapLoss).toBe(backend.overlapLoss);
    expect(client.coverage).toEqual(backend.coverage);
  });

  it('tournament-only (short period) → identical', () => {
    const { backend, client } = compare([tournamentCamp], '2026-06-02', '2026-06-08');

    expect(client.gross).toBe(backend.gross);
    expect(client.overlapLoss).toBe(backend.overlapLoss);
  });

  it('loyalty + campaign overlap → loss identical', () => {
    const { backend, client } = compare([loyaltyCamp, campaignCamp], PERIOD[0], PERIOD[1]);
    expect(client.overlapLoss).toBe(backend.overlapLoss);
    expect(client.net).toBe(backend.net);
  });
});
