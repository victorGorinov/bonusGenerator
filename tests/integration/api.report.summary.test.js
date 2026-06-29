import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { ReportSummarySchema } from '../../src/validation/report.schema.js';
import { createReportController } from '../../src/controllers/report.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const MOCK_SUMMARY = 'The EU campaign projects 142% ROI with a 4.2% cost ratio, making it the stronger option for budget-constrained scenarios.';

function makeApp(aiResponses) {
  const app = express();
  app.use(express.json());
  const ctrl = createReportController({ ai: new MockAIProvider(aiResponses) });
  app.post('/api/reports/summary', validate(ReportSummarySchema), ctrl.summary);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.message, details: err.details });
  });
  return app;
}

const BASE_ACTIVITY = {
  title:     'VIP reactivation — DE',
  promoType: 'bonus',
  geo:       'de',
  segment:   'vip',
  econ:      { arpu: 142, ltv3: 312, roi3: 142, costRatio: 0.042 },
  params:    { players: 500, avgdep: 85, rtp: 0.96 },
};

describe('POST /api/reports/summary', () => {

  test('returns summary for single report', async () => {
    const res = await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'single', activities: [BASE_ACTIVITY], uiLang: 'en' })
      .expect(200);

    expect(res.body).toHaveProperty('summary');
    expect(typeof res.body.summary).toBe('string');
    expect(res.body.summary.length).toBeGreaterThan(10);
  });

  test('returns summary for comparison report', async () => {
    const activity2 = { ...BASE_ACTIVITY, title: 'Welcome — RU', geo: 'ru', segment: 'mid' };
    const res = await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'comparison', activities: [BASE_ACTIVITY, activity2], uiLang: 'ru' })
      .expect(200);

    expect(res.body.summary).toBeTruthy();
  });

  test('returns summary for period report with forecast', async () => {
    const res = await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({
        type:       'period',
        activities: [BASE_ACTIVITY],
        forecast:   { gross: 50000, overlapLoss: 3000, net: 47000, netProfit: 35000, coverage: { total: 8, withEcon: 6 } },
        uiLang:     'en',
      })
      .expect(200);

    expect(res.body.summary).toBeTruthy();
  });

  test('rejects empty activities array', async () => {
    await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'single', activities: [], uiLang: 'en' })
      .expect(400);
  });

  test('rejects invalid type', async () => {
    await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'invalid', activities: [BASE_ACTIVITY], uiLang: 'en' })
      .expect(400);
  });

  test('rejects missing required fields in activity', async () => {
    await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'single', activities: [{ title: 'test' }], uiLang: 'en' })
      .expect(400);
  });

  test('handles null econ in activity', async () => {
    const activityNoEcon = { ...BASE_ACTIVITY, econ: null };
    const res = await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'single', activities: [activityNoEcon], uiLang: 'en' })
      .expect(200);

    expect(res.body.summary).toBeTruthy();
  });

  test('defaults uiLang to en when not provided', async () => {
    const res = await request(makeApp([MOCK_SUMMARY]))
      .post('/api/reports/summary')
      .send({ type: 'single', activities: [BASE_ACTIVITY] })
      .expect(200);

    expect(res.body.summary).toBeTruthy();
  });
});
