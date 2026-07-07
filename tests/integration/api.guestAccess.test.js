import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';

// Guest (no auth cookie) feature gating — hybrid model (see src/config/features.ts).
// Guests get GUEST_FEATURES: bonus / campaign / tournament / games are open;
// loyalty / reports / calendar require an account → 403 FEATURE_FORBIDDEN.
// requireFeature does NO DB hit for a guest (no user id), so these run without a DB.

describe('Guest access — hybrid feature gating (real app, no auth cookie)', () => {
  it('POST /api/generate (bonus) is open to guests', async () => {
    const res = await request(app).post('/api/generate').send({
      region: 'eu', lic: 'mga', sitecur: 'EUR', depcur: 'EUR',
      players: 5000, avgdep: 100, plat: 'both', rtp: 96,
    });
    expect(res.status).toBe(200);
  });

  it('POST /api/campaign/generate is open to guests', async () => {
    const res = await request(app).post('/api/campaign/generate').send({
      scenario: { id: 'first_dep' },
      params:   { geo: 'de', segment: 'mid', players: 5000 },
    });
    expect(res.status).toBe(200);
    expect(res.body.mechanic).toBeDefined();
  });

  it('POST /api/tournament/generate is open to guests', async () => {
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

  it('POST /api/games/recommend is open to guests', async () => {
    const res = await request(app).post('/api/games/recommend').send({ geo: 'de', segment: 'mid' });
    expect(res.status).toBe(200);
    expect(res.body.sections).toBeDefined();
  });

  it('POST /api/loyalty/generate is BLOCKED for guests (403 FEATURE_FORBIDDEN)', async () => {
    const res = await request(app).post('/api/loyalty/generate').send({
      mode: 'hybrid', numTiers: 5, topCashbackRate: 0.10, earnRateDeposit: 10,
      earnRateWager: 1, redeemRate: 100, redeemMinPoints: 1000, pointsExpiry: 0,
      missionCount: 3, region: 'eu', segment: 'mid', players: 1000, avgdep: 100, arpu: 50,
    });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FEATURE_FORBIDDEN');
  });

  it('POST /api/reports/summary is BLOCKED for guests (403 before validation)', async () => {
    // requireFeature('reports') is router-level → runs before validate(schema),
    // so a guest gets 403 even with an empty body.
    const res = await request(app).post('/api/reports/summary').send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FEATURE_FORBIDDEN');
  });

  it('GET /api/features returns the guest feature set', async () => {
    const res = await request(app).get('/api/features');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
    expect(res.body.role).toBeNull();
    expect(res.body.features).toMatchObject({
      bonus: true, campaign: true, tournament: true, games: true,
      loyalty: false, reports: false, calendar: false,
    });
  });

  it('GET /api/admin/users is rejected for a guest (401)', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });
});
