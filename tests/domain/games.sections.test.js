import { describe, test, expect } from 'vitest';
import { groupGamesBySection } from '../../src/domain/games/sections.js';

const games = [
  { id: 'a', name: 'A', provider: 'P1', mechanic: 'slot',  volatility: 'high', rtp: 96, regions: ['eu'], segments: ['all'], mobile: true,  minBetTier: 'low', slotRank: 1 },
  { id: 'b', name: 'B', provider: 'P2', mechanic: 'slot',  volatility: 'low',  rtp: 95, regions: ['eu'], segments: ['all'], mobile: false, minBetTier: 'low', slotRank: 25 },
  { id: 'c', name: 'C', provider: 'P3', mechanic: 'crash', volatility: 'high', rtp: 97, regions: ['eu'], segments: ['all'], mobile: true,  minBetTier: 'low', slotRank: null },
  { id: 'd', name: 'D', provider: 'P4', mechanic: 'live',  volatility: 'mid',  rtp: 95, regions: ['eu'], segments: ['all'], mobile: true,  minBetTier: 'mid', slotRank: 5 },
  { id: 'e', name: 'E', provider: 'P5', mechanic: 'table', volatility: 'low',  rtp: 99, regions: ['eu'], segments: ['all'], mobile: false, minBetTier: 'mid', slotRank: 11 },
];

describe('groupGamesBySection', () => {

  test('popular bucket: slotRank <= 10, excludes null and > 10', () => {
    const { popular } = groupGamesBySection(games);
    const ids = popular.map(g => g.id);
    expect(ids).toContain('a'); // rank 1
    expect(ids).toContain('d'); // rank 5
    expect(ids).not.toContain('b'); // rank 25
    expect(ids).not.toContain('c'); // rank null
    expect(ids).not.toContain('e'); // rank 11
  });

  test('live bucket: mechanic live or table', () => {
    const { live } = groupGamesBySection(games);
    expect(live.map(g => g.id).sort()).toEqual(['d', 'e']);
  });

  test('fast bucket: mechanic crash', () => {
    const { fast } = groupGamesBySection(games);
    expect(fast.map(g => g.id)).toEqual(['c']);
  });

  test('highVolatility bucket: volatility high', () => {
    const { highVolatility } = groupGamesBySection(games);
    expect(highVolatility.map(g => g.id).sort()).toEqual(['a', 'c']);
  });

  test('mobileFriendly bucket: mobile true', () => {
    const { mobileFriendly } = groupGamesBySection(games);
    expect(mobileFriendly.map(g => g.id).sort()).toEqual(['a', 'c', 'd']);
  });

  test('a game can appear in multiple sections (buckets are not mutually exclusive)', () => {
    const { popular, highVolatility, mobileFriendly } = groupGamesBySection(games);
    expect(popular.map(g => g.id)).toContain('a');
    expect(highVolatility.map(g => g.id)).toContain('a');
    expect(mobileFriendly.map(g => g.id)).toContain('a');
  });

  test('empty input → empty buckets, no throw', () => {
    const result = groupGamesBySection([]);
    expect(result.popular).toEqual([]);
    expect(result.live).toEqual([]);
    expect(result.fast).toEqual([]);
    expect(result.highVolatility).toEqual([]);
    expect(result.mobileFriendly).toEqual([]);
  });

});
