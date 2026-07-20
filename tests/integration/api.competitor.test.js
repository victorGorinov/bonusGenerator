import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { CompetitorSearchSchema, CompetitorCompareSchema } from '../../src/validation/competitor.schema.js';
import { createCompetitorController } from '../../src/controllers/competitor.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';
import app from '../../src/server/app.js';

// Isolated app: wires the controller directly (bypasses requireFeature, so no DB
// needed) with a MockAIProvider — no real web search / AI call happens.
function makeApp(responses) {
  const a = express();
  a.use(express.json());
  const ctrl = createCompetitorController({ ai: new MockAIProvider(responses) });
  a.post('/api/competitor/search',  validate(CompetitorSearchSchema),  ctrl.search);
  a.post('/api/competitor/compare', validate(CompetitorCompareSchema), ctrl.compare);
  // eslint-disable-next-line no-unused-vars
  a.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ code: err.code, message: err.message });
  });
  return a;
}

const FOUND = JSON.stringify({
  found: true, confidence: 'confirmed', sourceUrl: 'https://lunabet.example/promo',
  params: { matchPct: '100%', maxBonus: '€150', wager: '40x', minDeposit: '€20', maxWin: '€500', validityDays: '5' },
  notes: 'Найдено на промо-странице',
});

const NOT_FOUND = JSON.stringify({
  found: false, confidence: 'unconfirmed', sourceUrl: null, params: {}, notes: 'Публичный источник не найден',
});

const COMPARE = JSON.stringify({
  verdict: 'Предложение конкурентно по вейджеру, но проигрывает по порогу входа.',
  strengths: ['Вейджер 35× ниже среднего по выборке'],
  weaknesses: ['Мин. депозит €20 выше, чем €10 у NovaPlay'],
  recommendations: [
    { param: 'minDeposit', current: '€20', competitorBenchmark: '€10 (NovaPlay)', suggested: '€10', reason: 'Снижает порог входа без удара по экономике', impact: 'high' },
    { param: 'validityDays', current: '7', competitorBenchmark: '14 (NovaPlay)', suggested: '10', reason: 'Расширяет окно отыгрыша', impact: 'medium' },
  ],
});

describe('POST /api/competitor/search', () => {
  it('returns a found competitor with source=ai_search and parsed params', async () => {
    const res = await request(makeApp([FOUND]))
      .post('/api/competitor/search')
      .send({ casinoName: 'LunaBet', region: 'eu', promoType: 'bonus', uiLang: 'ru' })
      .expect(200);

    expect(res.body.name).toBe('LunaBet');
    expect(res.body.source).toBe('ai_search');
    expect(res.body.found).toBe(true);
    expect(res.body.confidence).toBe('confirmed');
    expect(res.body.sourceUrl).toBe('https://lunabet.example/promo');
    expect(res.body.params.wager).toBe('40x');
  });

  it('surfaces a not-found result honestly (unconfirmed, null source, no invented params)', async () => {
    const res = await request(makeApp([NOT_FOUND]))
      .post('/api/competitor/search')
      .send({ casinoName: 'GhostCasino', region: 'eu', promoType: 'wheel' })
      .expect(200);

    expect(res.body.found).toBe(false);
    expect(res.body.confidence).toBe('unconfirmed');
    expect(res.body.sourceUrl).toBeNull();
    expect(res.body.params).toEqual({});
  });

  it('400 on missing casinoName', async () => {
    await request(makeApp([FOUND]))
      .post('/api/competitor/search')
      .send({ region: 'eu', promoType: 'bonus' })
      .expect(400);
  });

  it('400 on invalid promoType', async () => {
    await request(makeApp([FOUND]))
      .post('/api/competitor/search')
      .send({ casinoName: 'X', region: 'eu', promoType: 'raffle' })
      .expect(400);
  });
});

describe('POST /api/competitor/compare', () => {
  const body = {
    region: 'eu', promoType: 'bonus',
    ownOffer: { label: 'Welcome', params: { matchPct: '100%', wager: '35x', minDeposit: '€20', validityDays: '7' } },
    competitors: [
      { name: 'NovaPlay', source: 'manual', params: { minDeposit: '€10', validityDays: '14' } },
    ],
    uiLang: 'ru',
  };

  it('returns verdict + strengths + weaknesses + recommendations', async () => {
    const res = await request(makeApp([COMPARE]))
      .post('/api/competitor/compare')
      .send(body)
      .expect(200);

    expect(res.body.verdict).toBeTypeOf('string');
    expect(res.body.strengths.length).toBeGreaterThan(0);
    expect(res.body.weaknesses.length).toBeGreaterThan(0);
    expect(res.body.recommendations[0].param).toBe('minDeposit');
    expect(res.body.recommendations[0].impact).toBe('high');
    expect(res.body.recommendations[1].impact).toBe('med'); // 'medium' normalised
  });

  it('400 when more than 3 competitors are sent', async () => {
    const tooMany = { ...body, competitors: Array(4).fill(body.competitors[0]) };
    await request(makeApp([COMPARE]))
      .post('/api/competitor/compare')
      .send(tooMany)
      .expect(400);
  });

  it('400 with zero competitors', async () => {
    await request(makeApp([COMPARE]))
      .post('/api/competitor/compare')
      .send({ ...body, competitors: [] })
      .expect(400);
  });
});

describe('Competitor analysis — guest gating (real app, no auth cookie)', () => {
  it('POST /api/competitor/search is BLOCKED for guests (403 FEATURE_FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/competitor/search')
      .send({ casinoName: 'LunaBet', region: 'eu', promoType: 'bonus' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FEATURE_FORBIDDEN');
  });

  it('POST /api/competitor/compare is BLOCKED for guests (403 before validation)', async () => {
    const res = await request(app).post('/api/competitor/compare').send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FEATURE_FORBIDDEN');
  });

  it('GET /api/features exposes competitorComparison:false for guests', async () => {
    const res = await request(app).get('/api/features');
    expect(res.status).toBe(200);
    expect(res.body.features.competitorComparison).toBe(false);
  });
});
