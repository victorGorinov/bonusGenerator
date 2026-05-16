import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';

const VALID_BODY = {
  region: 'eu', lic: 'mga', sitecur: 'EUR', depcur: 'EUR',
  avgdep: 100, players: 5000, plat: 'both', rtp: 96,
};

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/generate', () => {
  it('returns cfg for valid EU/MGA params', async () => {
    const res = await request(app).post('/api/generate').send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.cfg).toBeDefined();
    expect(res.body.cfg.welcome).toBeDefined();
    expect(res.body.cfg.econ.costRatio).toBeGreaterThan(0);
  });

  it('returns cfg for CIS region', async () => {
    const res = await request(app).post('/api/generate').send({
      region: 'cis', sitecur: 'RUB', depcur: 'RUB',
      avgdep: 100, players: 5000, plat: 'both', rtp: 96,
    });
    expect(res.status).toBe(200);
    expect(res.body.cfg.cur).toBe('RUB');
  });

  it('returns cfg for sweep region', async () => {
    const res = await request(app).post('/api/generate').send({
      region: 'sweep', sitecur: 'USD', depcur: 'USD',
      avgdep: 20, players: 5000, plat: 'both', rtp: 96,
    });
    expect(res.status).toBe(200);
    expect(res.body.cfg.wager.wW).toBe(0);
  });

  it('returns 400 for invalid region', async () => {
    const res = await request(app).post('/api/generate').send({ ...VALID_BODY, region: 'xx' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing region', async () => {
    const { region, ...noRegion } = VALID_BODY;
    const res = await request(app).post('/api/generate').send(noRegion);
    expect(res.status).toBe(400);
  });

  it('returns 400 for players out of range', async () => {
    const res = await request(app).post('/api/generate').send({ ...VALID_BODY, players: 50 });
    expect(res.status).toBe(400);
    expect(res.body.details.fieldErrors.players).toBeDefined();
  });

  it('coerces string numbers', async () => {
    const res = await request(app).post('/api/generate').send({
      ...VALID_BODY, players: '5000', avgdep: '100', rtp: '96',
    });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/recalc', () => {
  it('returns recalc costs for valid cfg', async () => {
    const genRes = await request(app).post('/api/generate').send(VALID_BODY);
    const cfg    = genRes.body.cfg;

    const res = await request(app).post('/api/recalc').send({ cfg, overrides: {} });
    expect(res.status).toBe(200);
    expect(res.body.costs).toBeDefined();
    expect(res.body.costs.total).toBeGreaterThan(0);
  });

  it('returns 400 when cfg missing', async () => {
    const res = await request(app).post('/api/recalc').send({ overrides: {} });
    expect(res.status).toBe(400);
  });
});
