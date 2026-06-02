// Unit tests for parseRecTarget — AI rec → DOM override mapping.
// Tests all supported params and edge cases.

import { describe, it, expect } from 'vitest';
import { parseRecTarget } from '../../public/bonus-cost.js';

describe('parseRecTarget — wager', () => {
  it('numeric string → ov_w_wager', () => {
    expect(parseRecTarget('wager', '40')).toEqual({ 'ov_w_wager': 40 });
  });
  it('float string → ov_w_wager', () => {
    expect(parseRecTarget('wager', '35.5')).toEqual({ 'ov_w_wager': 35.5 });
  });
  it('non-numeric → empty object', () => {
    expect(parseRecTarget('wager', 'high')).toEqual({});
  });
  it('number value directly', () => {
    expect(parseRecTarget('wager', 25)).toEqual({ 'ov_w_wager': 25 });
  });
});

describe('parseRecTarget — matchPct', () => {
  it('numeric string → ov_w_pct', () => {
    expect(parseRecTarget('matchPct', '75')).toEqual({ 'ov_w_pct': 75 });
  });
  it('100% match', () => {
    expect(parseRecTarget('matchPct', '100')).toEqual({ 'ov_w_pct': 100 });
  });
  it('non-numeric → empty', () => {
    expect(parseRecTarget('matchPct', 'medium')).toEqual({});
  });
});

describe('parseRecTarget — addFS', () => {
  it('"false" disables FS → zeros on ov_w_fs and ov_fs_count', () => {
    const result = parseRecTarget('addFS', 'false');
    expect(result['ov_w_fs']).toBe(0);
    expect(result['ov_fs_count']).toBe(0);
  });
  it('"0" also disables FS', () => {
    const result = parseRecTarget('addFS', '0');
    expect(result['ov_w_fs']).toBe(0);
    expect(result['ov_fs_count']).toBe(0);
  });
  it('"true" → empty (cannot add FS via override)', () => {
    expect(parseRecTarget('addFS', 'true')).toEqual({});
  });
});

describe('parseRecTarget — addReload', () => {
  it('"false" → ov_rl_pct: 0', () => {
    expect(parseRecTarget('addReload', 'false')).toEqual({ 'ov_rl_pct': 0 });
  });
  it('"no" → ov_rl_pct: 0', () => {
    expect(parseRecTarget('addReload', 'no')).toEqual({ 'ov_rl_pct': 0 });
  });
  it('"true" → empty', () => {
    expect(parseRecTarget('addReload', 'true')).toEqual({});
  });
});

describe('parseRecTarget — addDep2', () => {
  it('"false" → ov_d2_pct: 0', () => {
    expect(parseRecTarget('addDep2', 'false')).toEqual({ 'ov_d2_pct': 0 });
  });
});

describe('parseRecTarget — unmapped params', () => {
  it('addCashback → empty (not controllable via override)', () => {
    expect(parseRecTarget('addCashback', 'false')).toEqual({});
  });
  it('rtp → empty (RTP is a form slider, not an override input)', () => {
    expect(parseRecTarget('rtp', '96')).toEqual({});
  });
  it('plat → empty', () => {
    expect(parseRecTarget('plat', 'mobile')).toEqual({});
  });
  it('unknown param → empty', () => {
    expect(parseRecTarget('someUnknownParam', '42')).toEqual({});
  });
});
