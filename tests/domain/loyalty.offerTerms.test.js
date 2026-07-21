import { describe, test, expect } from 'vitest';
import { buildLoyaltyTerms } from '../../src/domain/loyalty/offerTerms.js';

const CONFIG = {
  mode: 'hybrid', region: 'eu', segment: 'mid',
  tiers: [
    { name: 'bronze', label: 'Bronze', minPoints: 0,    cashbackRate: 0 },
    { name: 'silver', label: 'Silver', minPoints: 1000, cashbackRate: 0.05 },
    { name: 'gold',   label: 'Gold',   minPoints: 3000, cashbackRate: 0.10 },
  ],
  earnRedeem: { earnRateDeposit: 10, earnRateWager: 1, redeemRate: 100, redeemMinPoints: 1000, pointsExpiry: 0 },
  missions: [{ id: 'm1', name: 'Depositor' }],
};

describe('buildLoyaltyTerms', () => {
  test('deterministic', () => {
    expect(buildLoyaltyTerms(CONFIG, 'en')).toEqual(buildLoyaltyTerms(CONFIG, 'en'));
  });

  test('EN labels + exact values', () => {
    const by = Object.fromEntries(buildLoyaltyTerms(CONFIG, 'en').map(t => [t.label, t.value]));
    expect(by['Program type']).toBe('Tiers + missions');
    expect(by['Tiers']).toBe('Bronze → Gold (3 tiers)');
    expect(by['Top-tier cashback']).toBe('10%');
    expect(by['Earn (deposit)']).toBe('10 pts / $1');
    expect(by['Redeem']).toBe('100 pts = $1');
    expect(by['Min redemption']).toBe('1000 pts');
    expect(by['Points expiry']).toBe('No expiry');
    expect(by['Missions']).toBe('1');
  });

  test('RU labels', () => {
    const by = Object.fromEntries(buildLoyaltyTerms(CONFIG, 'ru').map(t => [t.label, t.value]));
    expect(by['Тип программы']).toBe('Уровни + миссии');
    expect(by['Обмен баллов']).toBe('100 балл. = $1');
    expect(by['Срок действия баллов']).toBe('Без срока');
  });

  test('points expiry in months when set', () => {
    const cfg = { ...CONFIG, earnRedeem: { ...CONFIG.earnRedeem, pointsExpiry: 12 } };
    const by = Object.fromEntries(buildLoyaltyTerms(cfg, 'en').map(t => [t.label, t.value]));
    expect(by['Points expiry']).toBe('12 months');
  });

  test('no undefined/NaN in any value', () => {
    for (const t of buildLoyaltyTerms(CONFIG, 'en')) expect(t.value).not.toMatch(/undefined|NaN/);
  });
});
