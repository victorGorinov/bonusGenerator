import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { WheelGenerateSchema, WheelAuditSchema, WheelOptimizeSchema } from '../../src/validation/wheel.schema.js';
import { createWheelController } from '../../src/controllers/wheel.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const AUDIT_RESPONSE = JSON.stringify({
  checks: [
    { label: 'Prize odds', status: 'ok', note: 'Odds disclosed.', rule: 'UKGC LCCP' },
    { label: 'Empty segment', status: 'warn', note: 'Frame honestly.', rule: 'ASA CAP' },
  ],
  recommendations: [{ text: 'Disclose per-segment odds in T&Cs.', impact: 'Compliance' }],
});

const OPTIMIZE_RESPONSE = JSON.stringify({
  recommendations: [
    { param: 'weights', current: 'jackpot 5%', target: 'jackpot 2%', reason: 'Lower EV to improve ROI.', impact: 'high' },
    { param: 'frequency', current: 'daily', target: 'weekly', reason: 'Reduce spins/month.', impact: 'medium' },
  ],
});

function makeApp(aiResponses) {
  const app = express();
  app.use(express.json());
  const ctrl = createWheelController({ ai: new MockAIProvider(aiResponses) });
  app.post('/api/wheel/generate', validate(WheelGenerateSchema), ctrl.generate);
  app.post('/api/wheel/audit',    validate(WheelAuditSchema),    ctrl.audit);
  app.post('/api/wheel/optimize', validate(WheelOptimizeSchema), ctrl.optimize);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

const GEN_BODY = { params: { geo: 'de', segment: 'depositors', preset: 'welcome', players: 5000 } };

describe('POST /api/wheel/generate', () => {
  test('returns spec + econ for a preset', async () => {
    const res = await request(makeApp([])).post('/api/wheel/generate').send(GEN_BODY).expect(200);
    expect(res.body).toHaveProperty('spec');
    expect(res.body).toHaveProperty('econ');
    expect(res.body.spec.preset).toBe('welcome');
    expect(res.body.spec.segments.length).toBeGreaterThan(1);
    expect(res.body.econ.programCostMid).toBeGreaterThanOrEqual(0);
    expect(res.body.econ.evPerSpin).toBeGreaterThan(0);
  });

  test('materializes rich-prize amounts from avgDeposit', async () => {
    const res = await request(makeApp([]))
      .post('/api/wheel/generate')
      .send({ params: { geo: 'de', preset: 'welcome', avgDeposit: 200 } })
      .expect(200);
    const jackpot = res.body.spec.segments.find(s => s.prizeType === 'jackpot');
    expect(jackpot.prizeValue).toBe(1000); // 5× × 200
  });

  test('accepts user-tweaked segments', async () => {
    const custom = [
      { prizeType: 'free_spins', weight: 60, prizeValue: 10 },
      { prizeType: 'nothing', weight: 40, prizeValue: 0 },
    ];
    const res = await request(makeApp([]))
      .post('/api/wheel/generate')
      .send({ params: { geo: 'de', preset: 'daily', segments: custom } })
      .expect(200);
    expect(res.body.spec.segments.length).toBe(2);
  });

  test('400 on invalid preset', async () => {
    await request(makeApp([]))
      .post('/api/wheel/generate')
      .send({ params: { geo: 'de', preset: 'nonexistent' } })
      .expect(400);
  });
});

describe('POST /api/wheel/audit', () => {
  test('returns checks + recommendations', async () => {
    const spec = { preset: 'welcome', frequency: 'on_deposit', segments: [{ prizeType: 'free_spins', weight: 100, prizeValue: 20 }] };
    const res = await request(makeApp([AUDIT_RESPONSE]))
      .post('/api/wheel/audit')
      .send({ spec, params: { geo: 'uk', segment: 'new' }, uiLang: 'en' })
      .expect(200);
    expect(res.body.checks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/wheel/optimize', () => {
  const ECON = {
    evPerSpin: 3.5, participantsMid: 1200, spinsPerParticipant: 1.5, programCostMid: 6300,
    ggrUpliftMid: 3900, retentionValue: 6240, totalValueMid: 10140, netResultMid: 3840,
    roi: 161, costRatio: 8.1, costPerActiveMid: 5, maxRisk: 6800, breakEvenParticipants: 371,
  };
  test('returns recommendations', async () => {
    const res = await request(makeApp([OPTIMIZE_RESPONSE]))
      .post('/api/wheel/optimize')
      .send({ params: { geo: 'de', segment: 'depositors', preset: 'welcome', frequency: 'daily' }, econ: ECON, uiLang: 'en' })
      .expect(200);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(['high', 'med', 'low']).toContain(res.body.recommendations[0].impact);
  });

  test('400 on missing econ field', async () => {
    await request(makeApp([]))
      .post('/api/wheel/optimize')
      .send({ params: { geo: 'de' }, econ: { evPerSpin: 3.5 } })
      .expect(400);
  });
});
