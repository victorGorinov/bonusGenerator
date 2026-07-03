import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';

// Closes a test-coverage gap found in code review: api.generate.test.js proves
// guest (no auth cookie) access works for /api/generate, but the other route
// groups that were switched from requireAuth to optionalAuth in the same
// change (src/server/app.ts) had no equivalent test through the real app —
// every other campaign/tournament/loyalty/reports integration test builds its
// own bare express() instance and calls the controller directly, bypassing
// app.ts's middleware wiring entirely. These tests hit the real app so a
// regression that reverts one of these mounts back to requireAuth is caught.

describe('Guest access (optionalAuth) — real app, no auth cookie', () => {
  it('POST /api/campaign/generate works without a session cookie', async () => {
    const res = await request(app).post('/api/campaign/generate').send({
      scenario: { id: 'first_dep' },
      params:   { geo: 'de', segment: 'mid', players: 5000 },
    });
    expect(res.status).toBe(200);
    expect(res.body.mechanic).toBeDefined();
  });

  it('POST /api/tournament/generate works without a session cookie', async () => {
    const res = await request(app).post('/api/tournament/generate').send({
      type: 'slot',
      params: {
        geo: 'kz', segment: 'all', duration: 'weekly', prizePool: 150000,
        poolModel: 'fixed', totalPlayers: 5000, entryModel: 'freeroll',
        scoring: 'total_wins', distribution: 'top_n', reentry: 'single',
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.spec).toBeDefined();
  });

  it('POST /api/loyalty/generate works without a session cookie', async () => {
    const res = await request(app).post('/api/loyalty/generate').send({
      mode: 'hybrid', numTiers: 5, topCashbackRate: 0.10, earnRateDeposit: 10,
      earnRateWager: 1, redeemRate: 100, redeemMinPoints: 1000, pointsExpiry: 0,
      missionCount: 3, region: 'eu', segment: 'mid', players: 1000, avgdep: 100, arpu: 50,
    });
    expect(res.status).toBe(200);
    expect(res.body.config).toBeDefined();
  });

  it('POST /api/reports/summary is not blocked by auth (fails validation, not 401)', async () => {
    // Empty body avoids an AI call — asserts the request cleared optionalAuth
    // and reached validate(schema), which would 401 first if requireAuth had
    // been left on this route by mistake.
    const res = await request(app).post('/api/reports/summary').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
