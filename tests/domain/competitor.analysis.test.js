import { describe, it, expect } from 'vitest';
import { parseNum, classifyCell, buildRows, PARAM_DEFS } from '../../public/competitor-analysis.js';

describe('parseNum', () => {
  it('extracts numbers from display strings', () => {
    expect(parseNum('€1,000', 'higher')).toBe(1000);
    expect(parseNum('35x', 'lower')).toBe(35);
    expect(parseNum('12.5%', 'lower')).toBe(12.5);
    expect(parseNum('14 days', 'higher')).toBe(14);
    expect(parseNum(200, 'higher')).toBe(200);
  });

  it('distinguishes thousands commas from decimal commas', () => {
    expect(parseNum('1,000', 'higher')).toBe(1000);      // thousands
    expect(parseNum('12,500', 'higher')).toBe(12500);    // thousands
    expect(parseNum('1,234,567', 'higher')).toBe(1234567);
    expect(parseNum('1,5', 'lower')).toBe(1.5);          // decimal comma (RU/EU)
    expect(parseNum('1,5%', 'lower')).toBe(1.5);
    expect(parseNum('€1,000.50', 'higher')).toBe(1000.5); // both → dot is decimal
  });

  it('maps special tokens by direction', () => {
    expect(parseNum('no limit', 'higher')).toBe(Infinity);      // unlimited max win = best
    expect(parseNum('без лимита', 'higher')).toBe(Infinity);
    expect(parseNum('never', 'higher')).toBe(Infinity);         // points never expire = best
    expect(parseNum('бессрочно', 'higher')).toBe(Infinity);
    expect(parseNum('Free', 'lower')).toBe(0);                  // free entry = lowest barrier
    expect(parseNum('бесплатно', 'lower')).toBe(0);
  });

  it('returns null for non-comparable / missing values', () => {
    expect(parseNum('н/д', 'higher')).toBeNull();
    expect(parseNum('', 'lower')).toBeNull();
    expect(parseNum(null, 'higher')).toBeNull();
    expect(parseNum('Top-10', 'strategic')).toBe(10); // still parses a number if present
    expect(parseNum('no limit', 'lower')).toBeNull(); // unlimited only special for 'higher'
  });
});

describe('classifyCell', () => {
  it('higher-is-better params', () => {
    expect(classifyCell('higher', '€200', '€150')).toBe('win');   // own bigger max bonus
    expect(classifyCell('higher', '€200', '€300')).toBe('lose');
    expect(classifyCell('higher', '€200', '€200')).toBe('par');
    expect(classifyCell('higher', '€1,000', 'no limit')).toBe('lose'); // unlimited beats 1000
  });

  it('lower-is-better params', () => {
    expect(classifyCell('lower', '35x', '40x')).toBe('win');      // own lower wager
    expect(classifyCell('lower', '35x', '30x')).toBe('lose');
    expect(classifyCell('lower', '€20', 'Free')).toBe('lose');    // free entry beats €20
  });

  it('strategic params are always neutral', () => {
    expect(classifyCell('strategic', 'Top-10', 'Top-20')).toBe('strategic');
    expect(classifyCell('strategic', 'Daily', 'Weekly')).toBe('strategic');
  });

  it('non-comparable values → na', () => {
    expect(classifyCell('higher', 'н/д', '€200')).toBe('na');
    expect(classifyCell('lower', '20x', 'н/д')).toBe('na');
  });
});

describe('buildRows', () => {
  it('produces one row per promo-type param with classified cells', () => {
    const rows = buildRows(
      'bonus', 'ru',
      { matchPct: '100%', maxBonus: '€200', wager: '35x', minDeposit: '€20', maxWin: '€1,000', validityDays: '7 дней' },
      [
        { name: 'LunaBet', source: 'ai_search', confidence: 'confirmed',
          params: { matchPct: '100%', maxBonus: '€150', wager: '40x', minDeposit: '€20', maxWin: '€500', validityDays: '5 дней' } },
        { name: 'NovaPlay', source: 'manual',
          params: { minDeposit: '€10', validityDays: '14 дней' } },
      ],
    );
    expect(rows).toHaveLength(PARAM_DEFS.bonus.length);

    const wager = rows.find((r) => r.key === 'wager');
    expect(wager.cells[0].cls).toBe('win');   // Retomat 35x < LunaBet 40x

    const minDep = rows.find((r) => r.key === 'minDeposit');
    expect(minDep.cells[0].cls).toBe('par');  // both €20
    expect(minDep.cells[1].cls).toBe('lose'); // NovaPlay €10 < €20

    const maxWin = rows.find((r) => r.key === 'maxWin');
    expect(maxWin.cells[0].cls).toBe('win');  // €1000 > €500
    expect(maxWin.cells[1].cls).toBe('na');   // NovaPlay missing maxWin
  });

  it('covers all four promo types', () => {
    for (const type of ['bonus', 'tournament', 'loyalty', 'wheel']) {
      const rows = buildRows(type, 'en', {}, []);
      expect(rows.length).toBe(PARAM_DEFS[type].length);
    }
  });
});
