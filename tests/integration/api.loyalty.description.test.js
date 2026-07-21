import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { LoyaltyDescriptionSchema } from '../../src/validation/loyalty.schema.js';
import { createLoyaltyController } from '../../src/controllers/loyalty.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const CONFIG = {
  mode: 'hybrid', region: 'eu', segment: 'mid',
  tiers: [
    { name: 'bronze', label: 'Bronze', minPoints: 0, cashbackRate: 0 },
    { name: 'gold', label: 'Gold', minPoints: 3000, cashbackRate: 0.10 },
  ],
  earnRedeem: { earnRateDeposit: 10, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 1000, pointsExpiry: 0 },
  missions: [{ id: 'm1', name: 'Depositor' }],
};

const VALID_DESC = JSON.stringify({
  title: 'Join Our VIP Rewards Program',
  hook: 'Earn points on every deposit and climb from Bronze to Gold for up to 10% cashback.',
  howItWorks: ['Opt in to the program', 'Earn 10 points per $1 deposited', 'Redeem 100 points for $1'],
  termsIntro: 'Program at a glance:',
  cta: 'Join now',
  termsAndConditions: [
    'Open to registered players aged 18+.',
    'Earn 10 points per $1 deposited.',
    'Redeem from 1000 points; 100 points = $1.',
    'Top-tier cashback of 10% applies at Gold tier.',
  ],
});

function makeApp(responses) {
  const app = express();
  app.use(express.json());
  const ctrl = createLoyaltyController({ ai: new MockAIProvider(responses) });
  app.post('/api/loyalty/description', validate(LoyaltyDescriptionSchema), ctrl.description);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/loyalty/description', () => {
  test('returns AI prose + deterministic terms + T&C', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/loyalty/description')
      .send({ config: CONFIG })
      .expect(200);

    expect(res.body).toHaveProperty('title');
    expect(Array.isArray(res.body.termsAndConditions)).toBe(true);
    const by = Object.fromEntries(res.body.terms.map(t => [t.label, t.value]));
    expect(by['Redeem']).toBe('100 pts = $1');
    expect(by['Top-tier cashback']).toBe('10%');
  });

  test('terms respect uiLang=ru', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/loyalty/description')
      .send({ config: CONFIG, uiLang: 'ru' })
      .expect(200);
    expect(res.body.terms.map(t => t.label)).toContain('Тип программы');
  });

  test('400 on missing config', async () => {
    await request(makeApp([VALID_DESC]))
      .post('/api/loyalty/description')
      .send({})
      .expect(400);
  });

  test('502 on malformed AI JSON', async () => {
    await request(makeApp(['not json']))
      .post('/api/loyalty/description')
      .send({ config: CONFIG })
      .expect(502);
  });
});
