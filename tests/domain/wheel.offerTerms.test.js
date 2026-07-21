import { describe, test, expect } from 'vitest';
import { buildWheelTerms } from '../../src/domain/wheel/offerTerms.js';

const PARAMS = { geo: 'de', segment: 'depositors', wager: 20, lang: 'en' };
const SPEC = {
  preset: 'vip', frequency: 'weekly',
  segments: [
    { prizeType: 'bonus_money', weight: 30, prizeValue: 50 },
    { prizeType: 'free_spins',  weight: 40, prizeValue: 20 },
    { prizeType: 'nothing',     weight: 20, prizeValue: 0 },
    { prizeType: 'jackpot',     weight: 1,  prizeValue: 1000 },
  ],
};

describe('buildWheelTerms', () => {
  test('deterministic', () => {
    expect(buildWheelTerms(PARAMS, SPEC, 'en')).toEqual(buildWheelTerms(PARAMS, SPEC, 'en'));
  });

  test('EN labels + exact values', () => {
    const by = Object.fromEntries(buildWheelTerms(PARAMS, SPEC, 'en').map(t => [t.label, t.value]));
    expect(by['Wheel']).toBe('VIP wheel');
    expect(by['Spin cadence']).toBe('Weekly');
    expect(by['Segments']).toBe('4');
    expect(by['Prizes']).toBe('Bonus money, Free spins, Jackpot'); // 'nothing' excluded
    expect(by['Wagering']).toBe('×20');
    expect(by['Eligibility']).toBe('Depositors');
  });

  test('RU labels', () => {
    const by = Object.fromEntries(buildWheelTerms(PARAMS, SPEC, 'ru').map(t => [t.label, t.value]));
    expect(by['Колесо']).toBe('VIP-колесо');
    expect(by['Призы']).toBe('Бонусные деньги, Фриспины, Джекпот');
    expect(by['Кто участвует']).toBe('Игроки с депозитом');
  });

  test('no wager term when wager 0/absent', () => {
    const by = Object.fromEntries(buildWheelTerms({ geo: 'de', segment: 'new' }, SPEC, 'en').map(t => [t.label, t.value]));
    expect(by['Wagering']).toBeUndefined();
  });

  test('no undefined/NaN', () => {
    for (const t of buildWheelTerms(PARAMS, SPEC, 'en')) expect(t.value).not.toMatch(/undefined|NaN/);
  });
});
