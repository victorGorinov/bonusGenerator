import { describe, test, expect } from 'vitest';
import { buildOfferTerms } from '../../src/domain/campaign/offerTerms.js';

const WELCOME = { pct: 100, maxB: 500, minD: 20, cur: 'EUR', wager: 35, fs: 50, days: 30, code: 'WELCOME100' };

describe('buildOfferTerms', () => {
  test('null mechanic → empty list', () => {
    expect(buildOfferTerms(null, 'welcome', 'en')).toEqual([]);
  });

  test('deterministic — same input → identical output', () => {
    const a = buildOfferTerms(WELCOME, 'welcome', 'en');
    const b = buildOfferTerms(WELCOME, 'welcome', 'en');
    expect(a).toEqual(b);
  });

  test('welcome bonus: numbers come verbatim from config', () => {
    const terms = buildOfferTerms(WELCOME, 'welcome', 'en');
    const byLabel = Object.fromEntries(terms.map(t => [t.label, t.value]));
    expect(byLabel['Match']).toBe('100%');
    expect(byLabel['Max bonus']).toBe('500 EUR');
    expect(byLabel['Min deposit']).toBe('20 EUR');
    expect(byLabel['Wagering']).toBe('×35');
    expect(byLabel['Free spins']).toBe('50 free spins');
    expect(byLabel['Validity']).toBe('30 days');
    expect(byLabel['Promo code']).toBe('WELCOME100');
  });

  test('RU labels, same numbers', () => {
    const terms = buildOfferTerms(WELCOME, 'welcome', 'ru');
    const byLabel = Object.fromEntries(terms.map(t => [t.label, t.value]));
    expect(byLabel['Процент бонуса']).toBe('100%');
    expect(byLabel['Отыгрыш']).toBe('×35');
    expect(byLabel['Промокод']).toBe('WELCOME100');
  });

  test('cashback: no-wager term, percent of loss', () => {
    const terms = buildOfferTerms({ pct: 10, cur: 'EUR', maxAmt: 200, minLoss: 50 }, 'cashback', 'en');
    const byLabel = Object.fromEntries(terms.map(t => [t.label, t.value]));
    expect(byLabel['Cashback']).toBe('10% of net losses');
    expect(byLabel['Wagering']).toBe('No wagering');
    expect(byLabel['Max amount']).toBe('200 EUR');
  });

  test('ndb: no-deposit + free spins', () => {
    const terms = buildOfferTerms({ fs: 30, wager: 50, days: 7 }, 'ndb', 'en');
    const byLabel = Object.fromEntries(terms.map(t => [t.label, t.value]));
    expect(byLabel['Free spins']).toBe('30 free spins');
    expect(byLabel['Min deposit']).toBe('No deposit required');
    expect(byLabel['Wagering']).toBe('×50');
  });

  test('no currency → bare numbers, no undefined', () => {
    const terms = buildOfferTerms({ pct: 50, maxB: 100 }, 'reload', 'en');
    const maxB = terms.find(t => t.label === 'Max bonus');
    expect(maxB.value).toBe('100');
    for (const t of terms) expect(t.value).not.toMatch(/undefined|NaN/);
  });

  test('missing optional fields are omitted, not rendered as "—"', () => {
    const terms = buildOfferTerms({ pct: 100 }, 'welcome', 'en');
    const labels = terms.map(t => t.label);
    expect(labels).not.toContain('Free spins');
    expect(labels).not.toContain('Promo code');
    expect(labels).toContain('Validity'); // validity always present, defaults 30
  });
});
