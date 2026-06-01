import { describe, it, expect } from 'vitest';
import { tryRepairJSON, parseAI, bonusLine } from '../../src/domain/ai/parser.js';
import { parseTextsResponse, parseAuditResponse, parseTournamentOptimizeResponse } from '../../src/ai/parser.js';
import { AIProviderError } from '../../src/errors/AIProviderError.js';

// ── tryRepairJSON ─────────────────────────────────────────────────────────────

describe('tryRepairJSON', () => {
  it('parses valid JSON',              () => expect(tryRepairJSON('{"a":1}')).toEqual({ a: 1 }));
  it('closes unclosed object',         () => expect(tryRepairJSON('{"a":1')).toEqual({ a: 1 }));
  it('closes unclosed array',          () => expect(tryRepairJSON('[1,2,3')).toEqual([1, 2, 3]));
  it('closes unclosed string',         () => expect(tryRepairJSON('{"a":"hello')).not.toBeNull());
  it('returns null for unrecoverable', () => expect(tryRepairJSON('not json at all!!!')).toBeNull());
  it('handles nested structures', () => {
    const result = tryRepairJSON('{"a":{"b":[1,2,3');
    expect(result).not.toBeNull();
    expect(result.a.b).toEqual([1, 2, 3]);
  });
});

// ── parseAI ───────────────────────────────────────────────────────────────────

describe('parseAI', () => {
  it('parses clean JSON',              () => expect(parseAI('{"ok":true}')).toEqual({ ok: true }));
  it('strips ```json fences',          () => expect(parseAI('```json\n{"ok":true}\n```')).toEqual({ ok: true }));
  it('strips ``` fences',              () => expect(parseAI('```\n{"ok":true}\n```')).toEqual({ ok: true }));
  it('repairs and returns',            () => expect(parseAI('{"ok":true').ok).toBe(true));
  it('throws on truly invalid JSON',   () => expect(() => parseAI('not json {{{')).toThrow());
});

// ── bonusLine ─────────────────────────────────────────────────────────────────

describe('bonusLine', () => {
  it('returns fallback for null mech', () => expect(bonusLine(null, 'welcome')).toBe('bonus offer'));
  it('formats cashback',               () => {
    const line = bonusLine({ pct: 15 }, 'cashback');
    expect(line).toContain('15%');
    expect(line).toContain('no wagering');
  });
  it('formats ndb with free spins',    () => {
    expect(bonusLine({ fs: 50, wager: 35 }, 'ndb')).toContain('50 free spins');
  });
  it('formats match bonus',            () => {
    const line = bonusLine({ pct: 100, maxB: 500, cur: 'EUR', minD: 10, wager: 35, days: 30 }, 'welcome');
    expect(line).toContain('100%');
    expect(line).toContain('500');
    expect(line).toContain('35');
  });
});

// ── parseTextsResponse ────────────────────────────────────────────────────────

const VALID_TEXTS = JSON.stringify({
  push:     ['A push', 'B push', 'C push'],
  email:    [{ subject: 'Sub A', body: 'Body A' }, { subject: 'Sub B', body: 'Body B' }],
  sms:      ['A sms. STOP', 'B sms. STOP'],
  telegram: ['*A* telegram', '*B* telegram'],
  popup:    [{ headline: 'Headline', subtext: 'Subtext', cta: 'Claim' }],
});

describe('parseTextsResponse', () => {
  it('parses valid response', () => {
    const r = parseTextsResponse(VALID_TEXTS);
    expect(r.push).toHaveLength(3);
    expect(r.email[0]).toHaveProperty('subject');
    expect(r.popup[0]).toHaveProperty('cta');
  });
  it('strips markdown fences', () => {
    expect(parseTextsResponse('```json\n' + VALID_TEXTS + '\n```').push).toHaveLength(3);
  });
  it('throws AIProviderError on bad structure', () => {
    expect(() => parseTextsResponse('{"push":"not-array"}')).toThrow(AIProviderError);
  });
  it('throws on malformed JSON', () => {
    expect(() => parseTextsResponse('not json {{{')).toThrow();
  });
});

// ── parseAuditResponse ────────────────────────────────────────────────────────

const VALID_AUDIT = JSON.stringify({
  checks: [
    { label: 'Wagering', status: 'ok',   note: 'Within limits' },
    { label: 'Max bet',  status: 'warn', note: 'No clause found' },
  ],
  recommendations: [
    { text: 'Add max bet rule', impact: 'Reduces risk' },
  ],
});

describe('parseAuditResponse', () => {
  it('parses valid response', () => {
    const r = parseAuditResponse(VALID_AUDIT);
    expect(r.checks).toHaveLength(2);
    expect(r.recommendations[0]).toHaveProperty('impact');
  });
  it('rejects invalid status enum', () => {
    const bad = JSON.stringify({
      checks: [{ label: 'X', status: 'unknown', note: 'Y' }],
      recommendations: [{ text: 'T', impact: 'I' }],
    });
    expect(() => parseAuditResponse(bad)).toThrow(AIProviderError);
  });
  it('requires at least one check', () => {
    const bad = JSON.stringify({ checks: [], recommendations: [{ text: 'T', impact: 'I' }] });
    expect(() => parseAuditResponse(bad)).toThrow(AIProviderError);
  });
});

// ── parseTournamentOptimizeResponse ─────────────────────────────────────

const VALID_TOURNAMENT_OPTIMIZE = JSON.stringify({
  realism: {
    verdict: 'optimistic',
    summary: 'Forecast looks somewhat aggressive but plausible.',
    checks: [
      { metric: 'cost_per_active', forecast: 12, benchmark: '$8-$16', verdict: 'realistic', note: 'Cost is within range' },
      { metric: 'engagement', forecast: '×2.8', benchmark: '×2.5 typical', verdict: 'optimistic', note: 'High engagement expected' },
      { metric: 'roi', forecast: '150%', benchmark: '80%-120%', verdict: 'optimistic', note: 'ROI is above benchmark' },
    ],
  },
  recommendations: [
    { param: 'total_players', current: 5000, target: 6000, reason: 'Increase participant pool for better economies of scale', impact: 'medium' },
  ],
});

describe('parseTournamentOptimizeResponse', () => {
  it('parses valid response and normalizes numeric values and aliases', () => {
    const result = parseTournamentOptimizeResponse(VALID_TOURNAMENT_OPTIMIZE);
    expect(result.realism.verdict).toBe('optimistic');
    expect(result.realism.checks[0].metric).toBe('cost_per_active');
    expect(result.realism.checks[0].forecast).toBe('12');
    expect(result.realism.checks[0].benchmark).toBe('$8-$16');
    expect(result.recommendations[0].param).toBe('totalPlayers');
    expect(result.recommendations[0].current).toBe('5000');
    expect(result.recommendations[0].impact).toBe('med');
  });
});
