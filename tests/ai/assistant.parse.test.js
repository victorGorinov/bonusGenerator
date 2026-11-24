import { describe, it, expect } from 'vitest';
import { parseInterpretResponse } from '../../src/ai/parser.js';
import { AIProviderError } from '../../src/errors/AIProviderError.js';

const FULL = JSON.stringify({
  intent: 'prescriptive',
  scenario: { id: 'first_dep', lbl: 'Welcome', cat: 'acquisition' },
  params: { geo: 'de', segment: 'mid', bonusTypes: ['welcome'], lic: 'auto', agg: 'mid' },
  inferred: ['risk'],
  missing: [],
  notes: [],
  confidence: 0.9,
});

describe('parseInterpretResponse', () => {
  it('parses a full valid response', () => {
    const r = parseInterpretResponse(FULL);
    expect(r.intent).toBe('prescriptive');
    expect(r.params.geo).toBe('de');
    expect(r.scenario.id).toBe('first_dep');
    expect(r.confidence).toBe(0.9);
  });

  it('strips a ```json fence', () => {
    const r = parseInterpretResponse('```json\n' + FULL + '\n```');
    expect(r.params.geo).toBe('de');
  });

  it('applies envelope defaults on a bare object', () => {
    const r = parseInterpretResponse('{}');
    expect(r.intent).toBe('prescriptive');
    expect(r.params).toEqual({});
    expect(r.inferred).toEqual([]);
    expect(r.missing).toEqual([]);
    expect(r.notes).toEqual([]);
    expect(r.confidence).toBe(0.5);
  });

  it('normalizes an unknown intent to prescriptive', () => {
    const r = parseInterpretResponse(JSON.stringify({ intent: 'whatever', params: {} }));
    expect(r.intent).toBe('prescriptive');
  });

  it('coerces a string confidence and keeps params lenient', () => {
    const r = parseInterpretResponse(JSON.stringify({ params: { players: '5000' }, confidence: '0.7' }));
    expect(r.confidence).toBe(0.7);
    expect(r.params.players).toBe('5000');
  });

  it('throws AIProviderError on malformed JSON', () => {
    expect(() => parseInterpretResponse('not json {{{')).toThrow(AIProviderError);
  });
});
