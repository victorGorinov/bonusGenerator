import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { GamesRecommendSchema } from '../../src/validation/games.schema.js';
import { createGamesController } from '../../src/controllers/games.controller.js';

function makeApp() {
  const app = express();
  app.use(express.json());
  const ctrl = createGamesController();
  app.post('/api/games/recommend', validate(GamesRecommendSchema), ctrl.recommend);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/games/recommend', () => {

  test('returns sections + scores + region, no AI call involved', async () => {
    const res = await request(makeApp())
      .post('/api/games/recommend')
      .send({ geo: 'de', segment: 'mid' })
      .expect(200);

    expect(res.body.region).toBe('eu');
    expect(res.body.sections).toHaveProperty('popular');
    expect(res.body.sections).toHaveProperty('live');
    expect(res.body.sections).toHaveProperty('fast');
    expect(res.body.sections).toHaveProperty('highVolatility');
    expect(res.body.sections).toHaveProperty('mobileFriendly');
    expect(res.body.scores).toBeTypeOf('object');
    expect(res.body.all.length).toBeGreaterThan(0);
  });

  test('segment defaults to "all" when omitted', async () => {
    const res = await request(makeApp())
      .post('/api/games/recommend')
      .send({ geo: 'de' })
      .expect(200);

    expect(res.body.all.length).toBeGreaterThan(0);
  });

  test.each(['eu', 'cis', 'mn', 'latam', 'sweep', 'crypto'])(
    'accepts region cluster "%s" as geo (loyalty/CRM path)',
    async (geo) => {
      const res = await request(makeApp())
        .post('/api/games/recommend')
        .send({ geo, segment: 'mid' })
        .expect(200);
      expect(res.body.region).toBe(geo);
      expect(res.body.all.length).toBeGreaterThan(0);
    },
  );

  test('providers filter restricts sections to given providers', async () => {
    const res = await request(makeApp())
      .post('/api/games/recommend')
      .send({ geo: 'de', segment: 'mid', providers: ['Evolution'] })
      .expect(200);

    for (const g of res.body.all) {
      expect(g.provider).toBe('Evolution');
    }
  });

  test('no mechanic gating — sections can include slots, live, and crash together', async () => {
    const res = await request(makeApp())
      .post('/api/games/recommend')
      .send({ geo: 'de', segment: 'mid' })
      .expect(200);

    const mechanics = new Set(res.body.all.map(g => g.mechanic));
    expect(mechanics.size).toBeGreaterThan(1);
  });

  test('400 on missing geo', async () => {
    await request(makeApp())
      .post('/api/games/recommend')
      .send({ segment: 'mid' })
      .expect(400);
  });

  test('400 on invalid segment', async () => {
    await request(makeApp())
      .post('/api/games/recommend')
      .send({ geo: 'de', segment: 'whale' })
      .expect(400);
  });

  test('400 on non-array providers', async () => {
    await request(makeApp())
      .post('/api/games/recommend')
      .send({ geo: 'de', segment: 'mid', providers: 'Evolution' })
      .expect(400);
  });

});
