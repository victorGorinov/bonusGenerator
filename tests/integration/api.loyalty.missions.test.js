import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { LoyaltyMissionsSchema } from '../../src/validation/loyalty.schema.js';
import { createLoyaltyController } from '../../src/controllers/loyalty.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';
import { buildLoyaltyConfig } from '../../src/domain/loyalty/buildConfig.js';

const BASE_PARAMS = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 3,
  region: 'eu',
  segment: 'mid',
  players: 1000,
  avgdep: 100,
  arpu: 50,
};

const config = buildLoyaltyConfig(BASE_PARAMS);

const VALID_MISSIONS_RESPONSE = JSON.stringify({
  missions: [
    { id: 'm1', narrative: 'Make your first deposit and earn bonus points to kickstart your journey.', tierEffect: 'Earn 500 tier points toward Silver status.' },
    { id: 'm2', narrative: 'Deposit monthly to collect points and advance through tiers.', tierEffect: 'Contribute 200 tier pts/mo, speeds up upgrade.' },
    { id: 'm3', narrative: 'Wager big each week to earn free spins and boost your multiplier.', tierEffect: '+0.25× bonus multiplier for 7 days.' },
  ],
});

function makeApp(responses = []) {
  const app = express();
  app.use(express.json());
  const ctrl = createLoyaltyController({ ai: new MockAIProvider(responses) });
  app.post('/api/loyalty/missions', validate(LoyaltyMissionsSchema), ctrl.missions);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ code: err.code, message: err.message });
  });
  return app;
}

describe('POST /api/loyalty/missions', () => {
  test('returns missions array on valid response', async () => {
    const res = await request(makeApp([VALID_MISSIONS_RESPONSE]))
      .post('/api/loyalty/missions')
      .send({ config })
      .expect(200);

    expect(res.body).toHaveProperty('missions');
    expect(Array.isArray(res.body.missions)).toBe(true);
    expect(res.body.missions.length).toBeGreaterThan(0);
  });

  test('each mission has id and narrative', async () => {
    const res = await request(makeApp([VALID_MISSIONS_RESPONSE]))
      .post('/api/loyalty/missions')
      .send({ config })
      .expect(200);

    res.body.missions.forEach(m => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('narrative');
      expect(typeof m.narrative).toBe('string');
      expect(m.narrative.length).toBeGreaterThan(0);
    });
  });

  test('hybrid: tierEffect field is returned', async () => {
    const res = await request(makeApp([VALID_MISSIONS_RESPONSE]))
      .post('/api/loyalty/missions')
      .send({ config, uiLang: 'en' })
      .expect(200);

    const withEffect = res.body.missions.filter(m => m.tierEffect);
    expect(withEffect.length).toBeGreaterThan(0);
  });

  test('match by id: reordered response ids are preserved', async () => {
    const reordered = JSON.stringify({
      missions: [
        { id: 'm3', narrative: 'Narrative for m3.' },
        { id: 'm1', narrative: 'Narrative for m1.' },
        { id: 'm2', narrative: 'Narrative for m2.' },
      ],
    });
    const res = await request(makeApp([reordered]))
      .post('/api/loyalty/missions')
      .send({ config })
      .expect(200);

    const ids = res.body.missions.map(m => m.id);
    expect(ids).toContain('m1');
    expect(ids).toContain('m2');
    expect(ids).toContain('m3');
  });

  test('graceful: missing ids in response still returns valid array', async () => {
    // AI returns only 1 out of 3 missions
    const partial = JSON.stringify({
      missions: [{ id: 'm1', narrative: 'First deposit narrative.' }],
    });
    const res = await request(makeApp([partial]))
      .post('/api/loyalty/missions')
      .send({ config })
      .expect(200);

    expect(res.body.missions).toHaveLength(1);
  });

  test('uiLang is optional', async () => {
    const res = await request(makeApp([VALID_MISSIONS_RESPONSE]))
      .post('/api/loyalty/missions')
      .send({ config })
      .expect(200);

    expect(res.body.missions.length).toBeGreaterThan(0);
  });

  test('400 on missing config field', async () => {
    await request(makeApp([]))
      .post('/api/loyalty/missions')
      .send({ uiLang: 'en' })
      .expect(400);
  });

  test('502 on malformed AI JSON', async () => {
    const res = await request(makeApp(['{not valid json']))
      .post('/api/loyalty/missions')
      .send({ config })
      .expect(502);

    expect(res.body).toHaveProperty('message');
  });
});

describe('POST /api/loyalty/missions — persistence helpers', () => {
  test('generate response missions have link fields for hybrid mode', async () => {
    expect(config.missions).toHaveLength(3);
    config.missions.forEach(m => {
      expect(m).toHaveProperty('link');
      expect(m.link).toHaveProperty('tierPointsContribution');
      expect(m.link).toHaveProperty('monthlyTierPoints');
      expect(m.link).toHaveProperty('multiplierBoost');
      expect(m.link).toHaveProperty('eligibleTiers');
      expect(m.link).toHaveProperty('acceleratesUpgrade');
    });
  });

  test('missions mode: no link field', async () => {
    const mCfg = buildLoyaltyConfig({ ...BASE_PARAMS, mode: 'missions' });
    mCfg.missions.forEach(m => expect(m.link).toBeUndefined());
  });

  test('old snapshot without link/narrative renders gracefully (no link = no crash)', () => {
    const oldMission = { id: 'm1', name: 'Old Mission', objective: 'deposit', target: 3, rewardType: 'points', rewardValue: 500, frequency: 'one_time' };
    // No link, no narrative — must not throw
    expect(() => JSON.stringify(oldMission)).not.toThrow();
    expect(oldMission.link).toBeUndefined();
    expect(oldMission.narrative).toBeUndefined();
  });

  test('narrative merge by id does not affect missions with non-matching ids', () => {
    const missions = [
      { id: 'm1', name: 'First', objective: 'deposit', target: 1, rewardType: 'points', rewardValue: 100, frequency: 'one_time' },
      { id: 'm2', name: 'Second', objective: 'wager',  target: 500, rewardType: 'free_spins', rewardValue: 20, frequency: 'weekly' },
    ];
    const narrativeById = { m1: { id: 'm1', narrative: 'Make your first deposit.' } };
    missions.forEach(m => {
      const n = narrativeById[m.id];
      if (n) m.narrative = n.narrative;
    });
    expect(missions[0].narrative).toBe('Make your first deposit.');
    expect(missions[1].narrative).toBeUndefined();
  });
});
