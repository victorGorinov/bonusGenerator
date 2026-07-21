import { describe, test, expect } from 'vitest';
import { buildTournamentTerms } from '../../src/domain/tournament/offerTerms.js';

const PARAMS = {
  geo: 'de', segment: 'vip', duration: 'weekly', entryModel: 'freeroll',
  scoring: 'total_wins', distribution: 'top_n', reentry: 'single', prizePool: 10000,
};

describe('buildTournamentTerms', () => {
  test('deterministic — same input → identical output', () => {
    const a = buildTournamentTerms('slot', PARAMS, { prizePool: 10000 }, 'en');
    const b = buildTournamentTerms('slot', PARAMS, { prizePool: 10000 }, 'en');
    expect(a).toEqual(b);
  });

  test('EN labels + exact values from config', () => {
    const terms = buildTournamentTerms('slot', PARAMS, { prizePool: 10000 }, 'en');
    const by = Object.fromEntries(terms.map(t => [t.label, t.value]));
    expect(by['Format']).toBe('Slots tournament');
    expect(by['Prize pool']).toBe('EUR 10,000');
    expect(by['Duration']).toBe('Weekly');
    expect(by['Entry']).toBe('Free entry (freeroll)');
    expect(by['Scoring']).toBe('Total wins');
    expect(by['Prize distribution']).toBe('Top-N winners');
    expect(by['Eligibility']).toBe('VIP players');
  });

  test('RU labels localise', () => {
    const terms = buildTournamentTerms('live', PARAMS, { prizePool: 5000 }, 'ru');
    const by = Object.fromEntries(terms.map(t => [t.label, t.value]));
    expect(by['Формат']).toBe('Турнир в лайв-казино');
    expect(by['Призовой фонд']).toBe('EUR 5,000');
    expect(by['Кто участвует']).toBe('VIP-игроки');
  });

  test('spec.prizePool overrides params, currency from geo', () => {
    const terms = buildTournamentTerms('slot', { ...PARAMS, geo: 'uk' }, { prizePool: 2500 }, 'en');
    const pp = terms.find(t => t.label === 'Prize pool');
    expect(pp.value).toBe('GBP 2,500');
  });

  test('no prize pool → term omitted, no undefined', () => {
    const terms = buildTournamentTerms('mixed', { geo: 'de', segment: 'all' }, {}, 'en');
    expect(terms.find(t => t.label === 'Prize pool')).toBeUndefined();
    for (const t of terms) expect(t.value).not.toMatch(/undefined|NaN/);
  });
});
