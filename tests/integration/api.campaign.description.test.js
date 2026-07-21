import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { DescriptionSchema } from '../../src/validation/description.schema.js';
import { createCampaignController } from '../../src/controllers/campaign.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const MECHANIC = { pct: 100, maxB: 500, minD: 20, cur: 'EUR', wager: 35, fs: 50, days: 30, code: 'WELCOME100' };

const VALID_DESC = JSON.stringify({
  title: 'Get 100% up to 500 EUR on Your First Deposit',
  hook: 'Kick off your journey with a matched first deposit and 50 free spins.',
  howItWorks: ['Register an account', 'Make a deposit of at least 20 EUR', 'Your bonus is credited instantly'],
  termsIntro: 'Key terms at a glance:',
  cta: 'Claim bonus',
  termsAndConditions: [
    'Offer available to new players aged 18+ only.',
    'Minimum deposit of 20 EUR required to qualify.',
    'Bonus funds carry a ×35 wagering requirement.',
    'Bonus valid for 30 days after activation.',
  ],
});

function makeApp(responses) {
  const app = express();
  app.use(express.json());
  const ctrl = createCampaignController({ ai: new MockAIProvider(responses) });
  app.post('/api/campaign/description', validate(DescriptionSchema), ctrl.description);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

const BODY = { mechanic: MECHANIC, mechanicType: 'welcome', params: { geo: 'de', lang: 'en' } };

describe('POST /api/campaign/description', () => {
  test('returns AI prose + deterministic terms merged', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/campaign/description')
      .send(BODY)
      .expect(200);

    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('hook');
    expect(Array.isArray(res.body.howItWorks)).toBe(true);
    expect(res.body).toHaveProperty('cta');
    // Full T&C clauses come from the AI
    expect(Array.isArray(res.body.termsAndConditions)).toBe(true);
    expect(res.body.termsAndConditions.length).toBeGreaterThanOrEqual(1);
    // Terms-at-a-glance are server-computed, not from the AI response
    expect(Array.isArray(res.body.terms)).toBe(true);
    const byLabel = Object.fromEntries(res.body.terms.map(t => [t.label, t.value]));
    expect(byLabel['Match']).toBe('100%');
    expect(byLabel['Max bonus']).toBe('500 EUR');
    expect(byLabel['Promo code']).toBe('WELCOME100');
  });

  test('terms respect uiLang=ru', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/campaign/description')
      .send({ ...BODY, uiLang: 'ru' })
      .expect(200);
    const labels = res.body.terms.map(t => t.label);
    expect(labels).toContain('Процент бонуса');
  });

  test('400 on missing geo', async () => {
    await request(makeApp([VALID_DESC]))
      .post('/api/campaign/description')
      .send({ mechanic: MECHANIC, params: {} })
      .expect(400);
  });

  test('502 on malformed AI JSON', async () => {
    await request(makeApp(['not json at all']))
      .post('/api/campaign/description')
      .send(BODY)
      .expect(502);
  });
});
