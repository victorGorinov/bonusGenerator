import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { LoyaltyGenerateSchema, LoyaltyRecalcSchema } from '../../src/validation/loyalty.schema.js';
import { createLoyaltyController } from '../../src/controllers/loyalty.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const BASE = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 3,
  region: 'eu',
  segment: 'mid',
  players: 1000,
  avgdep: 100,
  arpu: 50,
};

function makeApp() {
  const app = express();
  app.use(express.json());
  const ctrl = createLoyaltyController({ ai: new MockAIProvider([]) });
  app.post('/api/loyalty/generate', validate(LoyaltyGenerateSchema), ctrl.generate);
  app.post('/api/loyalty/recalc',   validate(LoyaltyRecalcSchema),   ctrl.recalc);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/loyalty/generate', () => {
  test('returns config and econ for valid input', async () => {
    const res = await request(makeApp())
      .post('/api/loyalty/generate')
      .send(BASE)
      .expect(200);

    expect(res.body).toHaveProperty('config');
    expect(res.body).toHaveProperty('econ');
  });

  test('config.tiers length matches numTiers', async () => {
    const res = await request(makeApp())
      .post('/api/loyalty/generate')
      .send({ ...BASE, numTiers: 3 })
      .expect(200);

    expect(res.body.config.tiers).toHaveLength(3);
  });

  test('tiers mode → empty missions', async () => {
    const res = await request(makeApp())
      .post('/api/loyalty/generate')
      .send({ ...BASE, mode: 'tiers' })
      .expect(200);

    expect(res.body.config.missions).toHaveLength(0);
    expect(res.body.config.hasMissions).toBe(false);
  });

  test('econ contains expected numeric fields', async () => {
    const res = await request(makeApp())
      .post('/api/loyalty/generate')
      .send(BASE)
      .expect(200);

    const { econ } = res.body;
    expect(typeof econ.monthlyCostUSD).toBe('number');
    expect(typeof econ.costRatioPct).toBe('number');
    expect(typeof econ.retentionLiftPct).toBe('number');
    expect(typeof econ.roi3m).toBe('number');
    expect(typeof econ.breakEvenMonths).toBe('number');
    expect(econ.roi3m).toBeGreaterThan(0);
  });

  test('fills optional fields with defaults when omitted', async () => {
    const minimal = { region: 'eu' };
    const res = await request(makeApp())
      .post('/api/loyalty/generate')
      .send(minimal)
      .expect(200);

    expect(res.body.config.tiers).toHaveLength(5);
    expect(res.body.config.mode).toBe('hybrid');
  });

  test('400 on missing required region', async () => {
    const { region: _region, ...noRegion } = BASE;
    await request(makeApp())
      .post('/api/loyalty/generate')
      .send(noRegion)
      .expect(400);
  });

  test('400 on invalid mode', async () => {
    await request(makeApp())
      .post('/api/loyalty/generate')
      .send({ ...BASE, mode: 'unknown' })
      .expect(400);
  });

  test('400 on numTiers out of valid union (2)', async () => {
    await request(makeApp())
      .post('/api/loyalty/generate')
      .send({ ...BASE, numTiers: 2 })
      .expect(400);
  });

  test('400 on topCashbackRate > 0.30', async () => {
    await request(makeApp())
      .post('/api/loyalty/generate')
      .send({ ...BASE, topCashbackRate: 0.50 })
      .expect(400);
  });
});

describe('POST /api/loyalty/recalc', () => {
  test('returns config and econ', async () => {
    const res = await request(makeApp())
      .post('/api/loyalty/recalc')
      .send(BASE)
      .expect(200);

    expect(res.body).toHaveProperty('config');
    expect(res.body).toHaveProperty('econ');
  });

  test('doubling players doubles monthlyCostUSD', async () => {
    const [r1, r2] = await Promise.all([
      request(makeApp()).post('/api/loyalty/recalc').send({ ...BASE, players: 1000 }),
      request(makeApp()).post('/api/loyalty/recalc').send({ ...BASE, players: 2000 }),
    ]);
    expect(r2.body.econ.monthlyCostUSD).toBeCloseTo(r1.body.econ.monthlyCostUSD * 2, 0);
  });
});
