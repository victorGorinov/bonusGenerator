import { describe, it, expect } from 'vitest';
import { detectConflicts, datesOverlap } from '../../public/retention-calendar/conflicts.js';

const make = (overrides) => ({
  id: 'a', title: 'Test', type: 'reload', segment: 'all', geo: 'de',
  startDate: '2025-06-01', endDate: '2025-06-07',
  status: 'draft', brands: ['default'], createdAt: '', updatedAt: '',
  ...overrides,
});

describe('datesOverlap', () => {
  it('returns true for overlapping ranges', () => {
    expect(datesOverlap('2025-06-01', '2025-06-07', '2025-06-05', '2025-06-12')).toBe(true);
  });
  it('returns true for adjacent ranges (touching end/start)', () => {
    expect(datesOverlap('2025-06-01', '2025-06-07', '2025-06-07', '2025-06-14')).toBe(true);
  });
  it('returns false for non-overlapping ranges', () => {
    expect(datesOverlap('2025-06-01', '2025-06-07', '2025-06-08', '2025-06-14')).toBe(false);
  });
  it('returns true when one range contains the other', () => {
    expect(datesOverlap('2025-06-01', '2025-06-30', '2025-06-10', '2025-06-20')).toBe(true);
  });
});

describe('detectConflicts', () => {
  it('returns empty set for single campaign', () => {
    expect(detectConflicts([make({ id: 'a' })]).size).toBe(0);
  });

  it('detects conflict when same type, same segment, overlapping dates', () => {
    const a = make({ id: 'a', type: 'reload', segment: 'all', startDate: '2025-06-01', endDate: '2025-06-07' });
    const b = make({ id: 'b', type: 'reload', segment: 'all', startDate: '2025-06-05', endDate: '2025-06-12' });
    const result = detectConflicts([a, b]);
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
  });

  it('no conflict when same type but different segment', () => {
    const a = make({ id: 'a', type: 'reload', segment: 'all',  startDate: '2025-06-01', endDate: '2025-06-07' });
    const b = make({ id: 'b', type: 'reload', segment: 'vip',  startDate: '2025-06-05', endDate: '2025-06-12' });
    expect(detectConflicts([a, b]).size).toBe(0);
  });

  it('no conflict when same segment but different type', () => {
    const a = make({ id: 'a', type: 'reload',   segment: 'all', startDate: '2025-06-01', endDate: '2025-06-07' });
    const b = make({ id: 'b', type: 'cashback', segment: 'all', startDate: '2025-06-05', endDate: '2025-06-12' });
    expect(detectConflicts([a, b]).size).toBe(0);
  });

  it('no conflict when same type and segment but non-overlapping dates', () => {
    const a = make({ id: 'a', type: 'reload', segment: 'all', startDate: '2025-06-01', endDate: '2025-06-07' });
    const b = make({ id: 'b', type: 'reload', segment: 'all', startDate: '2025-06-08', endDate: '2025-06-14' });
    expect(detectConflicts([a, b]).size).toBe(0);
  });

  it('handles three-way conflict correctly', () => {
    const a = make({ id: 'a', type: 'vip', segment: 'vip', startDate: '2025-06-01', endDate: '2025-06-30' });
    const b = make({ id: 'b', type: 'vip', segment: 'vip', startDate: '2025-06-10', endDate: '2025-06-20' });
    const c = make({ id: 'c', type: 'vip', segment: 'vip', startDate: '2025-06-25', endDate: '2025-07-05' });
    const result = detectConflicts([a, b, c]);
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
    expect(result.has('c')).toBe(true);
  });
});
