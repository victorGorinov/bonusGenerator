import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';
import { pool } from '../../src/db/client.js';

// Phase 2 server-side persistence, exercised end-to-end through the real app
// (auth cookie → requireAuth → requireWorkspace → CRUD) against the live DB.
// Skips the whole suite if the DB is unreachable so `npm test` stays green
// offline / in a CI without DATABASE_URL secrets. Self-cleans: every account it
// creates is deleted in afterAll, cascading to its workspace + items.

const EMAIL_A = `savedtest+a-${Date.now()}@example.com`;
const EMAIL_B = `savedtest+b-${Date.now()}@example.com`;
let dbUp = false;

beforeAll(async () => {
  try {
    await pool.query('SELECT 1');
    dbUp = true;
  } catch {
    dbUp = false;
  }
});

afterAll(async () => {
  if (dbUp) {
    // Covers EMAIL_A/EMAIL_B plus the inline savedtest+* accounts the isolation/
    // validation cases register; cascade removes each workspace + its items.
    await pool.query("DELETE FROM users WHERE email LIKE 'savedtest+%'");
  }
  await pool.end();
});

describe.skipIf(!process.env.DATABASE_URL)('POST/GET/DELETE /api/saved/:entity', () => {
  it('rejects guests with 401', async () => {
    if (!dbUp) return;
    const res = await request(app).get('/api/saved/campaigns');
    expect(res.status).toBe(401);
  });

  it('CRUD round-trips a campaign for a logged-in user', async () => {
    if (!dbUp) return;
    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({
      name: 'Saved Test A', email: EMAIL_A, password: 'password123',
    });
    expect(reg.status).toBe(201);

    // empty to start
    let list = await agent.get('/api/saved/campaigns');
    expect(list.status).toBe(200);
    expect(list.body.items).toEqual([]);

    // create
    const save = await agent.post('/api/saved/campaigns').send({
      id: 'c-1', data: { id: 'c-1', name: 'Welcome push', foo: 42 },
    });
    expect(save.status).toBe(201);
    expect(save.body.item.id).toBe('c-1');
    expect(save.body.item.data).toEqual({ id: 'c-1', name: 'Welcome push', foo: 42 });

    // list reflects it
    list = await agent.get('/api/saved/campaigns');
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].data.name).toBe('Welcome push');

    // upsert (same client id) updates in place, no duplicate
    const upd = await agent.post('/api/saved/campaigns').send({
      id: 'c-1', data: { id: 'c-1', name: 'Welcome push v2' },
    });
    expect(upd.status).toBe(201);
    list = await agent.get('/api/saved/campaigns');
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].data.name).toBe('Welcome push v2');

    // delete
    const del = await agent.delete('/api/saved/campaigns/c-1');
    expect(del.status).toBe(200);
    list = await agent.get('/api/saved/campaigns');
    expect(list.body.items).toEqual([]);

    // delete again → 404
    const del2 = await agent.delete('/api/saved/campaigns/c-1');
    expect(del2.status).toBe(404);
  });

  it('isolates items by workspace', async () => {
    if (!dbUp) return;
    const agentA = request.agent(app);
    await agentA.post('/api/auth/register').send({
      name: 'ISO A', email: `savedtest+a-${Date.now()}@example.com`, password: 'password123',
    });
    // reuse EMAIL_B for a distinct account
    const agentB = request.agent(app);
    await agentB.post('/api/auth/register').send({
      name: 'ISO B', email: EMAIL_B, password: 'password123',
    });

    await agentB.post('/api/saved/tournaments').send({ id: 't-b', data: { secret: 'B' } });

    const listA = await agentA.get('/api/saved/tournaments');
    expect(listA.body.items).toEqual([]); // A can't see B's tournament
    const listB = await agentB.get('/api/saved/tournaments');
    expect(listB.body.items.map((i) => i.id)).toContain('t-b');
  });

  it('rejects unknown entity with 404', async () => {
    if (!dbUp) return;
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Bad Ent', email: `savedtest+a2-${Date.now()}@example.com`, password: 'password123',
    });
    const res = await agent.get('/api/saved/not-a-real-entity');
    expect(res.status).toBe(404);
  });

  it('validates the body (missing id → 400)', async () => {
    if (!dbUp) return;
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Val', email: `savedtest+a3-${Date.now()}@example.com`, password: 'password123',
    });
    const res = await agent.post('/api/saved/campaigns').send({ data: { x: 1 } });
    expect(res.status).toBe(400);
  });
});
