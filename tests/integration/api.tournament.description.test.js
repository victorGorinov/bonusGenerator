import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { TournamentDescriptionSchema } from '../../src/validation/tournament.schema.js';
import { createTournamentController } from '../../src/controllers/tournament.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const VALID_DESC = JSON.stringify({
  title: 'Weekly Slots Showdown — EUR 10,000 Prize Pool',
  hook: 'Climb the leaderboard and grab a share of the EUR 10,000 prize pool this week.',
  howItWorks: ['Opt in from the tournament page', 'Play eligible slots', 'Top the leaderboard by total wins'],
  termsIntro: 'Tournament at a glance:',
  cta: 'Join now',
  termsAndConditions: [
    'Open to players aged 18+ in eligible regions.',
    'Free entry (freeroll), single entry per player.',
    'Ranking is by total wins over the weekly period.',
    'Prizes are distributed to Top-N players and credited as cash.',
  ],
});

function makeApp(responses) {
  const app = express();
  app.use(express.json());
  const ctrl = createTournamentController({ ai: new MockAIProvider(responses) });
  app.post('/api/tournament/description', validate(TournamentDescriptionSchema), ctrl.description);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

const BODY = {
  type: 'slot',
  params: { geo: 'de', segment: 'vip', duration: 'weekly', entryModel: 'freeroll', scoring: 'total_wins', distribution: 'top_n', reentry: 'single', prizePool: 10000, lang: 'en' },
  spec: { prizePool: 10000 },
};

describe('POST /api/tournament/description', () => {
  test('returns AI prose + deterministic terms + T&C', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/tournament/description')
      .send(BODY)
      .expect(200);

    expect(res.body).toHaveProperty('title');
    expect(Array.isArray(res.body.howItWorks)).toBe(true);
    expect(Array.isArray(res.body.termsAndConditions)).toBe(true);
    expect(res.body.termsAndConditions.length).toBeGreaterThanOrEqual(1);
    const by = Object.fromEntries(res.body.terms.map(t => [t.label, t.value]));
    expect(by['Prize pool']).toBe('EUR 10,000');
    expect(by['Eligibility']).toBe('VIP players');
  });

  test('terms respect uiLang=ru', async () => {
    const res = await request(makeApp([VALID_DESC]))
      .post('/api/tournament/description')
      .send({ ...BODY, uiLang: 'ru' })
      .expect(200);
    expect(res.body.terms.map(t => t.label)).toContain('Призовой фонд');
  });

  test('400 on missing params', async () => {
    await request(makeApp([VALID_DESC]))
      .post('/api/tournament/description')
      .send({ type: 'slot', spec: {} })
      .expect(400);
  });

  test('502 on malformed AI JSON', async () => {
    await request(makeApp(['not json']))
      .post('/api/tournament/description')
      .send(BODY)
      .expect(502);
  });
});
