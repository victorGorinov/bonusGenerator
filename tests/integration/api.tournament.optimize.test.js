import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { TournamentOptimizeSchema } from '../../src/validation/tournament.schema.js';
import { createTournamentController } from '../../src/controllers/tournament.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const VALID_OPTIMIZE_RESPONSE = JSON.stringify({
  realism: {
    verdict: 'optimistic',
    summary: 'The ROI forecast of 2265% significantly exceeds the regional benchmark of -20% to 150%, suggesting the prize pool is too small relative to the projected GGR lift.',
    checks: [
      { metric: 'participation', forecast: '15%', benchmark: '8%–25%',    verdict: 'realistic',   note: 'Within normal weekly range.' },
      { metric: 'engagement',    forecast: '×2.5', benchmark: '×2.5',     verdict: 'realistic',   note: 'Matches industry benchmark for weekly.' },
      { metric: 'roi',           forecast: '2265%', benchmark: '-20%–150%', verdict: 'optimistic', note: 'Prize pool is too small vs projected GGR.' },
      { metric: 'cost_per_active', forecast: '$0.40', benchmark: '$0.10–$10', verdict: 'realistic', note: 'CPA within CIS benchmark.' },
    ],
  },
  recommendations: [
    { param: 'prizePool', current: '150000 KZT', target: '750000 KZT', reason: 'Increase prize pool to ~5× to reach realistic ROI range.', impact: 'high' },
    { param: 'duration',  current: 'weekly',      target: 'monthly',   reason: 'Monthly format sustains higher engagement, improving actual ROI.', impact: 'med' },
  ],
});

const BASE_ECON = {
  arpu: 11000, eligible: 5000, durationDays: 7, engagementMultiplier: 2.5,
  participantsMid: 750, ggrLiftMid: 2887500, retentionValue: 660000,
  prizePoolCost: 150000, netMarginMid: 2737500, totalValueMid: 3397500,
  roi: 2265, breakEvenParticipants: 39, costPerActiveMid: 200,
};

const BASE_PARAMS = {
  geo: 'kz', segment: 'all', duration: 'weekly', prizePool: 150000,
  poolModel: 'fixed', totalPlayers: 5000, entryModel: 'freeroll',
  scoring: 'total_wins', distribution: 'top_n', reentry: 'single',
};

function makeApp(aiResponses) {
  const app = express();
  app.use(express.json());
  const ctrl = createTournamentController({ ai: new MockAIProvider(aiResponses) });
  app.post('/api/tournament/optimize', validate(TournamentOptimizeSchema), ctrl.optimize);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/tournament/optimize', () => {

  test('returns realism + recommendations in review mode', async () => {
    const res = await request(makeApp([VALID_OPTIMIZE_RESPONSE]))
      .post('/api/tournament/optimize')
      .send({ type: 'slot', params: BASE_PARAMS, econ: BASE_ECON, mode: 'review' })
      .expect(200);

    expect(res.body).toHaveProperty('realism');
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.realism.verdict).toMatch(/^(realistic|optimistic|pessimistic)$/);
    expect(res.body.realism.checks.length).toBeGreaterThanOrEqual(3);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  test('returns realism + recommendations in optimize mode', async () => {
    const negativeEcon = { ...BASE_ECON, netMarginMid: -50000, totalValueMid: -40000, roi: -26 };
    const negResponse = JSON.stringify({
      realism: {
        verdict: 'pessimistic',
        summary: 'Negative ROI indicates prize pool exceeds GGR lift for this audience size.',
        checks: [
          { metric: 'roi', forecast: '-26%', benchmark: '-20%–150%', verdict: 'pessimistic', note: 'Below benchmark floor.' },
          { metric: 'participation', forecast: '15%', benchmark: '8%–25%', verdict: 'realistic', note: 'OK.' },
          { metric: 'engagement', forecast: '×2.5', benchmark: '×2.5', verdict: 'realistic', note: 'On target.' },
        ],
      },
      recommendations: [
        { param: 'prizePool', current: '150000 KZT', target: '100000 KZT', reason: 'Reduce prize pool to restore positive margin.', impact: 'high' },
      ],
    });

    const res = await request(makeApp([negResponse]))
      .post('/api/tournament/optimize')
      .send({ type: 'slot', params: BASE_PARAMS, econ: negativeEcon, mode: 'optimize' })
      .expect(200);

    expect(res.body.realism.verdict).toBe('pessimistic');
    expect(res.body.recommendations[0].param).toBe('prizePool');
  });

  test('checks contain valid metric/verdict enums', async () => {
    const res = await request(makeApp([VALID_OPTIMIZE_RESPONSE]))
      .post('/api/tournament/optimize')
      .send({ type: 'slot', params: BASE_PARAMS, econ: BASE_ECON, mode: 'review' })
      .expect(200);

    const validMetrics  = ['participation', 'engagement', 'roi', 'cost_per_active', 'retention', 'arpu'];
    const validVerdicts = ['realistic', 'optimistic', 'pessimistic'];
    for (const check of res.body.realism.checks) {
      expect(validMetrics).toContain(check.metric);
      expect(validVerdicts).toContain(check.verdict);
    }
    for (const rec of res.body.recommendations) {
      expect(['high', 'med', 'low']).toContain(rec.impact);
    }
  });

  test('400 on missing econ field', async () => {
    await request(makeApp([]))
      .post('/api/tournament/optimize')
      .send({ type: 'slot', params: BASE_PARAMS, mode: 'review' })
      .expect(400);
  });

  test('400 on invalid mode', async () => {
    await request(makeApp([]))
      .post('/api/tournament/optimize')
      .send({ type: 'slot', params: BASE_PARAMS, econ: BASE_ECON, mode: 'unknown' })
      .expect(400);
  });

});
