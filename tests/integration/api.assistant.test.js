import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';
import { AssistantInterpretSchema } from '../../src/validation/assistant.schema.js';
import { createAssistantController } from '../../src/controllers/assistant.controller.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

const VALID_RESPONSE = JSON.stringify({
  intent: 'prescriptive',
  scenario: { id: 'first_dep', lbl: 'Welcome', cat: 'acquisition' },
  params: { geo: 'de', segment: 'mid', bonusTypes: ['welcome'], lic: 'auto', agg: 'mid' },
  inferred: ['risk'],
  missing: [],
  notes: [],
  confidence: 0.9,
});

function makeApp(aiResponses) {
  const app = express();
  app.use(express.json());
  const ctrl = createAssistantController({ ai: new MockAIProvider(aiResponses) });
  app.post('/api/assistant/interpret', validate(AssistantInterpretSchema), ctrl.interpret);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ code: err.code, message: err.message });
  });
  return app;
}

describe('POST /api/assistant/interpret', () => {
  test('returns a refined interpretation for a valid prompt', async () => {
    const res = await request(makeApp([VALID_RESPONSE]))
      .post('/api/assistant/interpret')
      .send({ prompt: '100% welcome up to 200 EUR, 35x, Germany, mid', uiLang: 'en' })
      .expect(200);

    expect(res.body).toHaveProperty('intent', 'prescriptive');
    expect(res.body).toHaveProperty('params');
    expect(res.body.params.geo).toBe('de');
    expect(Array.isArray(res.body.inferred)).toBe(true);
    expect(Array.isArray(res.body.missing)).toBe(true);
    expect(Array.isArray(res.body.notes)).toBe(true);
    expect(typeof res.body.confidence).toBe('number');
  });

  test('400 on an empty prompt', async () => {
    await request(makeApp([]))
      .post('/api/assistant/interpret')
      .send({ prompt: '' })
      .expect(400);
  });

  test('400 when prompt is missing', async () => {
    await request(makeApp([]))
      .post('/api/assistant/interpret')
      .send({ uiLang: 'en' })
      .expect(400);
  });
});
