import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';
import { pool } from '../../src/db/client.js';

// A disabled account must be locked out everywhere an authenticated caller can
// reach — not just the requireFeature-gated tool routes. Exercised end-to-end
// against the live DB; skips cleanly when the DB is unreachable.

const EMAIL = `disabledtest+${Date.now()}@example.com`;
let dbUp = false;

beforeAll(async () => {
  try { await pool.query('SELECT 1'); dbUp = true; } catch { dbUp = false; }
});
afterAll(async () => {
  if (dbUp) await pool.query("DELETE FROM users WHERE email LIKE 'disabledtest+%'");
  await pool.end();
});

describe.skipIf(!process.env.DATABASE_URL)('Disabled user lockout', () => {
  it('is blocked at login, /api/auth/me, /api/saved, and tool routes', async () => {
    if (!dbUp) return;

    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({
      name: 'Disabled Test', email: EMAIL, password: 'password123',
    });
    expect(reg.status).toBe(201);

    // Admin disables the account out of band.
    await pool.query("UPDATE users SET status = 'disabled' WHERE email = $1", [EMAIL]);

    // Existing session cookie must stop working on the requireAuth-only surfaces.
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(403);
    expect(me.body.code).toBe('ACCOUNT_DISABLED');

    const saved = await agent.get('/api/saved/campaigns');
    expect(saved.status).toBe(403);
    expect(saved.body.code).toBe('ACCOUNT_DISABLED');

    // Feature-gated tool route: disabled → all features off → 403.
    const loyalty = await agent.post('/api/loyalty/generate').send({
      mode: 'hybrid', numTiers: 5, topCashbackRate: 0.10, earnRateDeposit: 10,
      earnRateWager: 1, redeemRate: 100, redeemMinPoints: 1000, pointsExpiry: 0,
      missionCount: 3, region: 'eu', segment: 'mid', players: 1000, avgdep: 100, arpu: 50,
    });
    expect(loyalty.status).toBe(403);
    expect(loyalty.body.code).toBe('FEATURE_FORBIDDEN');

    // Re-authenticating must not re-mint a session for a disabled account.
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'password123' });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('ACCOUNT_DISABLED');
  });
});
