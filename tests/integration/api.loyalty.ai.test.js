import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { LoyaltyTextsSchema, LoyaltyAuditSchema, LoyaltyOptimizeSchema } from '../../src/validation/loyalty.schema.js';
import { createLoyaltyController } from '../../src/controllers/loyalty.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const BASE_CONFIG = {
  mode: 'hybrid', region: 'eu', segment: 'mid',
  players: 1000, avgdep: 100, arpu: 50,
  tiers: [
    { name: 'bronze', label: 'Bronze', minPoints: 0,    bonusMultiplier: 1.00, cashbackRate: 0,    freeSpinsMonthly: 0,  depositBonusPct: 0,    maxBonus: 0 },
    { name: 'silver', label: 'Silver', minPoints: 1000,  bonusMultiplier: 1.25, cashbackRate: 0.05, freeSpinsMonthly: 5,  depositBonusPct: 0.05, maxBonus: 25 },
    { name: 'gold',   label: 'Gold',   minPoints: 3000,  bonusMultiplier: 1.50, cashbackRate: 0.10, freeSpinsMonthly: 15, depositBonusPct: 0.10, maxBonus: 50 },
  ],
  earnRedeem: { earnRateDeposit: 10, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 1000, pointsExpiry: 0 },
  missions: [{ id: 'm1', name: 'Monthly Depositor', objective: 'deposit', target: 1, rewardType: 'points', rewardValue: 200, frequency: 'monthly' }],
  hasMissions: true,
};

const BASE_ECON = {
  avgEarnedPointsPerPlayer: 600, avgRedeemedPointsPerPlayer: 240,
  pointRedemptionRate: 0.40, liabilityPerPlayer: 3.60, totalLiabilityUSD: 3600,
  monthlyCostUSD: 780, missionCostUSD: 70, tierRewardCostUSD: 500,
  costRatioPct: 15.6, retentionLiftPct: 9.2, additionalRevenue3m: 13800,
  breakEvenMonths: 1.7, roi3m: 1.76,
};

const VALID_TEXTS = JSON.stringify({
  push:     ['Join our new loyalty program!', 'Earn points every deposit!', 'Diamond tier awaits you!'],
  email:    [{ subject: 'Your Loyalty Program', body: 'Start earning points today.' }],
  sms:      ['New loyalty program — earn points now!', 'Cashback up to 10% — join today', 'Level up your rewards!'],
  telegram: ['🎉 New loyalty program launched!', '💎 Earn points on every deposit', '⭐ Join our rewards program'],
  popup:    [{ headline: 'Earn & Redeem Points', subtext: 'Get cashback on every bet', cta: 'Join Now' }],
});

const VALID_AUDIT = JSON.stringify({
  checks: [
    { label: 'Cashback T&C', status: 'ok',   note: 'Cashback terms are clearly stated', rule: 'MGA CRP/2016 §7' },
    { label: 'Points Expiry', status: 'ok',  note: 'No expiry — no disclosure needed', rule: 'MGA Best Practice' },
    { label: 'Tier Downgrade', status: 'warn', note: 'Downgrade criteria not visible in program spec', rule: 'MGA CRP/2016 §5' },
    { label: 'RG Opt-out', status: 'ok',     note: 'Opt-out mechanism should be confirmed', rule: 'MGA RG §12' },
    { label: 'Mission Fairness', status: 'ok', note: 'Mission targets are achievable and transparent', rule: 'MGA CRP/2016 §7' },
  ],
  recommendations: [
    { text: 'Add explicit tier downgrade rules to program T&Cs', impact: 'Reduces player complaints' },
    { text: 'Include responsible gambling opt-out in program onboarding', impact: 'Required by MGA RG' },
  ],
});

const VALID_OPTIMIZE = JSON.stringify({
  recommendations: [
    { param: 'earnRateDeposit', current: '10 pts/$1', target: '15 pts/$1', reason: 'Higher earn rate increases program engagement and retention lift', impact: 'high' },
    { param: 'topCashbackRate', current: '10%', target: '12%', reason: 'Slightly higher cashback improves VIP conversion without exceeding cost ratio benchmark', impact: 'med' },
  ],
});

function makeApp(responses) {
  const app = express();
  app.use(express.json());
  const ctrl = createLoyaltyController({ ai: new MockAIProvider(responses) });
  app.post('/api/loyalty/texts',    validate(LoyaltyTextsSchema),    ctrl.texts);
  app.post('/api/loyalty/audit',    validate(LoyaltyAuditSchema),    ctrl.audit);
  app.post('/api/loyalty/optimize', validate(LoyaltyOptimizeSchema), ctrl.optimize);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

describe('POST /api/loyalty/texts', () => {
  test('returns all text channels', async () => {
    const res = await request(makeApp([VALID_TEXTS]))
      .post('/api/loyalty/texts')
      .send({ config: BASE_CONFIG, econ: BASE_ECON })
      .expect(200);

    expect(res.body).toHaveProperty('push');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('sms');
    expect(res.body).toHaveProperty('telegram');
    expect(res.body).toHaveProperty('popup');
    expect(res.body.push.length).toBeGreaterThanOrEqual(1);
    expect(res.body.email[0]).toHaveProperty('subject');
    expect(res.body.popup[0]).toHaveProperty('headline');
  });

  test('400 on missing config', async () => {
    await request(makeApp([VALID_TEXTS]))
      .post('/api/loyalty/texts')
      .send({ econ: BASE_ECON })
      .expect(400);
  });

  test('accepts optional uiLang', async () => {
    const res = await request(makeApp([VALID_TEXTS]))
      .post('/api/loyalty/texts')
      .send({ config: BASE_CONFIG, econ: BASE_ECON, uiLang: 'ru' })
      .expect(200);
    expect(res.body).toHaveProperty('push');
  });
});

describe('POST /api/loyalty/audit', () => {
  test('returns checks and recommendations', async () => {
    const res = await request(makeApp([VALID_AUDIT]))
      .post('/api/loyalty/audit')
      .send({ config: BASE_CONFIG })
      .expect(200);

    expect(res.body).toHaveProperty('checks');
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.checks.length).toBeGreaterThanOrEqual(5);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  test('checks have valid status enum', async () => {
    const res = await request(makeApp([VALID_AUDIT]))
      .post('/api/loyalty/audit')
      .send({ config: BASE_CONFIG })
      .expect(200);

    for (const check of res.body.checks) {
      expect(['ok', 'warn']).toContain(check.status);
      expect(typeof check.label).toBe('string');
      expect(typeof check.note).toBe('string');
    }
  });

  test('400 on missing config', async () => {
    await request(makeApp([]))
      .post('/api/loyalty/audit')
      .send({})
      .expect(400);
  });
});

describe('POST /api/loyalty/optimize', () => {
  test('returns recommendations', async () => {
    const res = await request(makeApp([VALID_OPTIMIZE]))
      .post('/api/loyalty/optimize')
      .send({ config: BASE_CONFIG, econ: BASE_ECON })
      .expect(200);

    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  test('recommendations have valid param and impact', async () => {
    const res = await request(makeApp([VALID_OPTIMIZE]))
      .post('/api/loyalty/optimize')
      .send({ config: BASE_CONFIG, econ: BASE_ECON })
      .expect(200);

    const VALID_PARAMS  = ['topCashbackRate','earnRateDeposit','earnRateWager','redeemRate','missionCount','numTiers','mode','pointsExpiry'];
    const VALID_IMPACTS = ['high', 'med', 'low'];
    for (const rec of res.body.recommendations) {
      expect(VALID_PARAMS).toContain(rec.param);
      expect(VALID_IMPACTS).toContain(rec.impact);
      expect(typeof rec.reason).toBe('string');
    }
  });

  test('400 on missing econ', async () => {
    await request(makeApp([]))
      .post('/api/loyalty/optimize')
      .send({ config: BASE_CONFIG })
      .expect(400);
  });
});
