import { describe, it, expect } from 'vitest';
import { toCSV, toJSON } from '../../public/retention-calendar/export.js';

const CAMP = {
  id: 'abc123', title: 'Weekly Reload DE', type: 'reload', segment: 'all', geo: 'de',
  startDate: '2025-06-02', endDate: '2025-06-08', status: 'scheduled',
  brands: ['default'], mechanic: '50% reload', notes: 'Q2 campaign', tags: ['promo', 'q2'],
  createdAt: '2025-05-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
};

describe('toCSV', () => {
  it('produces header row with expected fields', () => {
    const csv = toCSV([CAMP]);
    const header = csv.split('\n')[0];
    expect(header).toContain('id');
    expect(header).toContain('title');
    expect(header).toContain('type');
    expect(header).toContain('startDate');
    expect(header).toContain('endDate');
  });

  it('produces one data row per campaign', () => {
    const csv = toCSV([CAMP]);
    const rows = csv.trim().split('\n');
    expect(rows).toHaveLength(2); // header + 1 data row
  });

  it('data row contains campaign values', () => {
    const csv = toCSV([CAMP]);
    expect(csv).toContain('abc123');
    expect(csv).toContain('Weekly Reload DE');
    expect(csv).toContain('2025-06-02');
  });

  it('escapes commas in values', () => {
    const c = { ...CAMP, title: 'Hello, World' };
    const csv = toCSV([c]);
    expect(csv).toContain('"Hello, World"');
  });

  it('joins tags with semicolon', () => {
    const csv = toCSV([CAMP]);
    expect(csv).toContain('promo;q2');
  });

  it('handles empty campaigns array', () => {
    const csv = toCSV([]);
    const rows = csv.trim().split('\n');
    expect(rows).toHaveLength(1); // header only
  });
});

describe('toJSON', () => {
  it('produces valid JSON', () => {
    const json = toJSON([CAMP]);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('round-trips campaign data', () => {
    const json   = toJSON([CAMP]);
    const parsed = JSON.parse(json);
    expect(parsed[0].id).toBe(CAMP.id);
    expect(parsed[0].title).toBe(CAMP.title);
    expect(parsed[0].tags).toEqual(CAMP.tags);
  });
});
