import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { WheelDescriptionSchema } from '../../src/validation/wheel.schema.js';
import { createWheelController } from '../../src/controllers/wheel.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const BODY = {
  params: { geo: 'de', segment: 'depositors', preset: 'vip', wager: 20, lang: 'en' },
  spec: {
    preset: 'vip', frequency: 'weekly',
    segments: [
      { prizeType: 'bonus_money', weight: 30, prizeValue: 50 },
      { prizeType: 'free_spins', weight: 40, prizeValue: 20 },
      { prizeType: 'nothing', weight: 20, prizeValue: 0 },
    ],
  },
};

const VALID_DESC = JSON.stringify({
  title: 'Spin the VIP Wheel of Fortune',
  hook: 'Every week, spin for a chance to win bonus money and free spins.',
  howItWorks: ['Qualify each week', 'Open the wheel', 'Spin for a random prize'],
  termsIntro: 'Wheel at a glance:',
  cta: 'Spin now',
  termsAndConditions: [
    'Open to eligible depositors aged 18+.',
    'One qualifying spin per week.',
    'Prizes are awarded at random.',
    'Bonus prizes carry a ×20 wagering requirement.',
  ],
});

function makeApp(responses) {
  const app = express();
  app.use(express.json());
  const ctrl = createWheelController({ ai: new MockAIProvider(responses) });
  app.post('/api/wheel/description', validate(WheelDescriptionSchema), ctrl.description);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/wheel/description', () => {
  test('returns AI prose + deterministic terms + T&C', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/wheel/description')
      .send(BODY)
      .expect(200);

    expect(res.body).toHaveProperty('title');
    expect(Array.isArray(res.body.termsAndConditions)).toBe(true);
    const by = Object.fromEntries(res.body.terms.map(t => [t.label, t.value]));
    expect(by['Wheel']).toBe('VIP wheel');
    expect(by['Prizes']).toBe('Bonus money, Free spins');
    expect(by['Wagering']).toBe('×20');
  });

  test('terms respect uiLang=ru', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/wheel/description')
      .send({ ...BODY, uiLang: 'ru' })
      .expect(200);
    expect(res.body.terms.map(t => t.label)).toContain('Колесо');
  });

  test('400 on missing spec', async () => {
    await request(makeApp([VALID_DESC]))
      .post('/api/wheel/description')
      .send({ params: {} })
      .expect(400);
  });

  test('502 on malformed AI JSON', async () => {
    await request(makeApp(['not json']))
      .post('/api/wheel/description')
      .send(BODY)
      .expect(502);
  });
});
