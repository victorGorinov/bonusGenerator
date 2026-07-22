import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAiBudget } from '../../src/middleware/aiBudget.js';

// A tiny app: optionalAuth is faked by stamping req.user, then the aiBudget
// middleware, then a trivial 200 handler. Uses an injected in-memory store — no DB.
function makeApp({ store, user, ...opts }) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.user = user; next(); });
  a.post('/ai', createAiBudget({ store, cacheTtlMs: 0, ...opts }), (_req, res) => res.json({ ok: true }));
  // eslint-disable-next-line no-unused-vars
  a.use((err, _req, res, _next) => res.status(err.status ?? 500).json({ code: err.code, message: err.message }));
  return a;
}

function fakeStore(init = {}) {
  const spend = init.spend ?? 0;
  const usage = init.usage ?? { today: 0, total: 0 };
  return {
    _bumps: 0,
    async getGlobalSpend() { return spend; },
    async getUserUsage() { return usage; },
    async bumpUser() { this._bumps += 1; },
    async recordGlobalSpend() { return { total: spend, crossedAlert: false }; },
  };
}

const USER = { id: '11111111-1111-1111-1111-111111111111', name: 'T', email: 't@x.io' };

describe('aiBudget middleware', () => {
  it('allows a call under all limits and records +1 for the user', async () => {
    const store = fakeStore();
    const res = await request(makeApp({ store, user: USER, budget: 20, dailyLimit: 30, totalLimit: 120 })).post('/ai').send({});
    expect(res.status).toBe(200);
    // res.on('finish') fires after the response is sent; give the microtask a tick.
    await new Promise((r) => setTimeout(r, 20));
    expect(store._bumps).toBe(1);
  });

  it('503 AI_BUDGET_EXCEEDED when global spend is at the cap (and does not record)', async () => {
    const store = fakeStore({ spend: 20 });
    const res = await request(makeApp({ store, user: USER, budget: 20 })).post('/ai').send({});
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('AI_BUDGET_EXCEEDED');
    await new Promise((r) => setTimeout(r, 20));
    expect(store._bumps).toBe(0);
  });

  it('429 AI_QUOTA_DAILY when the user hit the daily limit', async () => {
    const store = fakeStore({ usage: { today: 30, total: 40 } });
    const res = await request(makeApp({ store, user: USER, dailyLimit: 30, totalLimit: 120 })).post('/ai').send({});
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AI_QUOTA_DAILY');
  });

  it('429 AI_QUOTA_TOTAL when the user exhausted the beta allowance', async () => {
    const store = fakeStore({ usage: { today: 2, total: 120 } });
    const res = await request(makeApp({ store, user: USER, dailyLimit: 30, totalLimit: 120 })).post('/ai').send({});
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AI_QUOTA_TOTAL');
  });

  it('fails CLOSED (503) if the store throws', async () => {
    const store = { getGlobalSpend() { throw new Error('db down'); } };
    const res = await request(makeApp({ store, user: USER })).post('/ai').send({});
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
  });
});
