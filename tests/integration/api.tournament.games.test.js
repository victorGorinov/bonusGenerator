import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { TournamentGamesSchema } from '../../src/validation/tournament.schema.js';
import { createTournamentController } from '../../src/controllers/tournament.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';
import { asyncHandler } from '../../src/middleware/asyncHandler.js';

const VALID_GAMES_RESPONSE = JSON.stringify({
  rationale: 'High-volatility slots suit VIP EU players seeking big wins.',
  games: [
    { id: 'gates-of-olympus',      why: 'Top EU slot, high multiplier potential.' },
    { id: 'fire-in-the-hole-3',    why: 'Extreme volatility beloved by VIP grinders.' },
    { id: 'dead-or-alive-2',       why: 'Classic high-variance VIP favourite.' },
    { id: 'wanted-dead-or-a-wild', why: 'High multipliers, strong EU performance.' },
    { id: 'san-quentin-xways',     why: 'Max-win hunting, ideal for VIP segment.' },
  ],
});

function makeApp(aiResponses) {
  const app = express();
  app.use(express.json());
  const ctrl = createTournamentController({ ai: new MockAIProvider(aiResponses) });
  app.post('/api/tournament/games', validate(TournamentGamesSchema), ctrl.games);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/tournament/games', () => {

  test('returns primary + alternatives + rationale', async () => {
    const res = await request(makeApp([VALID_GAMES_RESPONSE]))
      .post('/api/tournament/games')
      .send({ geo:'de', segment:'vip', type:'slot', scoring:'highest_multiplier' })
      .expect(200);

    expect(res.body.primary).toBeInstanceOf(Array);
    expect(res.body.primary.length).toBeLessThanOrEqual(5);
    expect(res.body.alternatives).toBeInstanceOf(Array);
    expect(res.body.rationale).toBeTypeOf('string');
    expect(res.body.region).toBe('eu');
    for (const g of res.body.primary) {
      expect(g).toHaveProperty('id');
      expect(g).toHaveProperty('name');
      expect(g).toHaveProperty('provider');
    }
  });

  test('type=slot → no live/table games in output', async () => {
    const app = makeApp([VALID_GAMES_RESPONSE]);
    const res = await request(app)
      .post('/api/tournament/games')
      .send({ geo:'de', segment:'depositors', type:'slot', scoring:'total_wins' });

    expect(res.status).toBe(200);
    for (const g of [...res.body.primary, ...res.body.alternatives]) {
      expect(['slot','crash']).toContain(g.mechanic);
    }
  });

  test('degrades gracefully when AI throws', async () => {
    const failingAI = { async generate() { throw new Error('AI unavailable'); } };
    const app = express();
    app.use(express.json());
    const ctrl = createTournamentController({ ai: failingAI });
    app.post('/api/tournament/games', validate(TournamentGamesSchema), ctrl.games);
    // eslint-disable-next-line no-unused-vars
    app.use((_err, _req, res, _next) => { res.status(500).json({ message: 'error' }); });

    const res = await request(app)
      .post('/api/tournament/games')
      .send({ geo:'de', segment:'vip', type:'slot', scoring:'highest_multiplier' })
      .expect(200);

    expect(res.body.primary).toBeInstanceOf(Array);
    expect(res.body.primary.length).toBeGreaterThan(0);
    expect(res.body.rationale).toBeNull();
  });

  test('400 on missing required fields', async () => {
    await request(makeApp([]))
      .post('/api/tournament/games')
      .send({ geo: 'de' })
      .expect(400);
  });

  test('400 on invalid segment', async () => {
    await request(makeApp([]))
      .post('/api/tournament/games')
      .send({ geo:'de', segment:'whale', type:'slot', scoring:'total_wins' })
      .expect(400);
  });

});
