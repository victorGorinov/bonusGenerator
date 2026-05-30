import { describe, it, expect } from 'vitest';
import { buildConfig } from '../../src/domain/bonus/buildConfig.js';

const base = { players: 5000, plat: 'both', rtp: 96 };

const eu  = { ...base, region: 'eu',     sitecur: 'EUR', depcur: 'EUR', avgdep: 100 };
const cis = { ...base, region: 'cis',    sitecur: 'RUB', depcur: 'RUB', avgdep: 100 };
const sw  = { ...base, region: 'sweep',  sitecur: 'USD', depcur: 'USD', avgdep:  20 };
const cry = { ...base, region: 'crypto', sitecur: 'ETH', depcur: 'ETH', avgdep: 100 };
const mn  = { ...base, region: 'mn',     sitecur: 'MNT', depcur: 'MNT', avgdep: 100 };
const lat = { ...base, region: 'latam',  sitecur: 'USD', depcur: 'USD', avgdep: 100 };

// ── EU / MGA ──────────────────────────────────────────────────────────────────

describe('buildConfig — EU/MGA', () => {
  const cfg = buildConfig({ ...eu, lic: 'mga' });

  it('costRatio > 0',                    () => expect(cfg.econ.costRatio).toBeGreaterThan(0));
  it('welcome pct = 100%',              () => expect(cfg.welcome.pct).toBe(100));
  it('welcome maxB ≥ 1000',            () => expect(cfg.welcome.maxB).toBeGreaterThanOrEqual(1000));
  it('wager model = standard',          () => expect(cfg.wager.model).toBe('standard'));
  it('cashback model = tier',           () => expect(cfg.cashback.model).toBe('tier'));
  it('econ has arpu + cac',             () => {
    expect(cfg.econ.arpu).toBeGreaterThan(0);
    expect(cfg.econ.cac).toBeGreaterThan(0);
  });
  it('reg strings present',             () => expect(cfg.reg).toHaveLength(5));
});

// ── EU / UKGC ─────────────────────────────────────────────────────────────────

describe('buildConfig — EU/UKGC', () => {
  const cfg = buildConfig({ ...eu, lic: 'ukgc' });

  it('caps welcome maxB ≤ 200',        () => expect(cfg.welcome.maxB).toBeLessThanOrEqual(200));
  it('wW = 10 (UKGC low wager)',        () => expect(cfg.wager.wW).toBe(10));
  it('NDB type = fs_restricted',        () => expect(cfg.ndb.type).toBe('fs_restricted'));
  it('reload has no free spins',        () => expect(cfg.reload.fs).toBe(0));
  it('reg strings present',             () => expect(cfg.reg).toHaveLength(6));
});

// ── CIS ───────────────────────────────────────────────────────────────────────

describe('buildConfig — CIS', () => {
  const cfg = buildConfig({ ...cis });

  it('currency is RUB',                 () => expect(cfg.cur).toBe('RUB'));
  it('welcome pct = 100%',             () => expect(cfg.welcome.pct).toBe(100));
  it('wW = 40',                         () => expect(cfg.wager.wW).toBe(40));
  it('cashback model = flat',           () => expect(cfg.cashback.model).toBe('flat'));
  it('no reg strings',                  () => expect(cfg.reg).toBeNull());
});

// ── Sweep ─────────────────────────────────────────────────────────────────────

describe('buildConfig — Sweep', () => {
  const cfg = buildConfig({ ...sw });

  it('wager model = none',              () => expect(cfg.wager.model).toBe('none'));
  it('wager.wW = 0',                    () => expect(cfg.wager.wW).toBe(0));
  it('welcome type = sweep',            () => expect(cfg.welcome.type).toBe('sweep'));
  it('fsSpec is null',                  () => expect(cfg.fsSpec).toBeNull());
  it('reg strings present',             () => expect(cfg.reg).toHaveLength(5));
});

// ── Crypto ────────────────────────────────────────────────────────────────────

describe('buildConfig — Crypto', () => {
  const cfg = buildConfig({ ...cry });

  it('welcome pct = 150%',             () => expect(cfg.welcome.pct).toBe(150));
  it('welcome maxB ≥ 1000',           () => expect(cfg.welcome.maxB).toBeGreaterThanOrEqual(1000));
  it('wager days = 90',                () => expect(cfg.wager.days).toBe(90));
  it('cashback pct = 15%',             () => expect(cfg.cashback.pct).toBe(15));
});

// ── Mongolia ──────────────────────────────────────────────────────────────────

describe('buildConfig — MN', () => {
  const cfg = buildConfig({ ...mn });

  it('currency is MNT',                () => expect(cfg.cur).toBe('MNT'));
  it('welcome maxB = 100000',          () => expect(cfg.welcome.maxB).toBe(100000));
  it('no reg strings',                 () => expect(cfg.reg).toBeNull());
});

// ── LatAm ─────────────────────────────────────────────────────────────────────

describe('buildConfig — LatAm', () => {
  const cfg = buildConfig({ ...lat });

  it('currency is USD',                () => expect(cfg.cur).toBe('USD'));
  it('welcome maxB between 300-500',   () => {
    expect(cfg.welcome.maxB).toBeGreaterThanOrEqual(300);
    expect(cfg.welcome.maxB).toBeLessThanOrEqual(500);
  });
  it('no reg strings',                 () => expect(cfg.reg).toBeNull());
});

// ── riskAdj ───────────────────────────────────────────────────────────────────

describe('buildConfig — riskAdj', () => {
  it('riskAdj +10 raises wager', () => {
    const base = buildConfig({ ...eu, lic: 'mga' });
    const risk = buildConfig({ ...eu, lic: 'mga', riskAdj: 10 });
    expect(risk.wager.wW).toBe(base.wager.wW + 10);
  });

  it('riskAdj -8 lowers wager', () => {
    const base = buildConfig({ ...eu, lic: 'mga' });
    const risk = buildConfig({ ...eu, lic: 'mga', riskAdj: -8 });
    expect(risk.wager.wW).toBe(base.wager.wW - 8);
  });

  it('wager never drops below 5', () => {
    const cfg = buildConfig({ ...eu, lic: 'ukgc', riskAdj: -100 });
    expect(cfg.wager.wW).toBeGreaterThanOrEqual(5);
  });
});

// ── EU / DGA ──────────────────────────────────────────────────────────────────

describe('buildConfig — EU/DGA (Denmark)', () => {
  const cfg = buildConfig({ ...eu, lic: 'dga', sitecur: 'DKK', depcur: 'DKK' });

  it('caps welcome maxB ≤ 1000 DKK',    () => expect(cfg.welcome.maxB).toBeLessThanOrEqual(1000));
  it('wW = 25 (DGA market practice)',    () => expect(cfg.wager.wW).toBe(25));
  it('NDB validity = 60 days',           () => expect(cfg.ndb.days).toBe(60));
  it('reg strings present',              () => expect(cfg.reg).toHaveLength(4));
});

// ── Global licenses ───────────────────────────────────────────────────────────

describe('buildConfig — Curaçao (global license on EU geo)', () => {
  const cfg = buildConfig({ ...eu, lic: 'curacao' });

  it('uses EU base wager model',         () => expect(cfg.wager.model).toBe('standard'));
  it('no strict bonus cap applied',      () => expect(cfg.welcome.maxB).toBeGreaterThan(200));
  it('reg strings are Curaçao strings',  () => {
    expect(cfg.reg).toEqual(['reg_curacao_1', 'reg_curacao_2']);
  });
  it('wager mb = v_standard_max_bet',    () => expect(cfg.wager.mb).toBe('v_standard_max_bet'));
});

describe('buildConfig — Curaçao on CIS geo', () => {
  const cfg = buildConfig({ ...cis, lic: 'curacao' });

  it('reg overridden to Curaçao strings', () => {
    expect(cfg.reg).toEqual(['reg_curacao_1', 'reg_curacao_2']);
  });
  it('still uses CIS currency',           () => expect(cfg.cur).toBe('RUB'));
});

describe('buildConfig — Gibraltar (global license)', () => {
  const cfg = buildConfig({ ...eu, lic: 'gibraltar' });

  it('wW capped at 30 (GRA context)',    () => expect(cfg.wager.wW).toBe(30));
  it('reg strings are Gibraltar strings', () => expect(cfg.reg).toEqual(['reg_gibraltar_1']));
});

// ── Snapshots ─────────────────────────────────────────────────────────────────

describe('buildConfig — snapshots', () => {
  it('CIS snapshot',    () => expect(buildConfig(cis)).toMatchSnapshot());
  it('EU/MGA snapshot', () => expect(buildConfig({ ...eu, lic: 'mga' })).toMatchSnapshot());
  it('Sweep snapshot',  () => expect(buildConfig(sw)).toMatchSnapshot());
  it('Crypto snapshot', () => expect(buildConfig(cry)).toMatchSnapshot());
  it('DK/DGA snapshot', () => expect(buildConfig({ ...eu, lic: 'dga', sitecur: 'DKK', depcur: 'DKK', avgdep: 700 })).toMatchSnapshot());
  it('MN snapshot',     () => expect(buildConfig({ ...mn, avgdep: 100000 })).toMatchSnapshot());
});

// ── Payout fallback (large-denomination currencies) ───────────────────────────

describe('buildConfig — payout fallback for large-denomination currencies', () => {
  it('RU sP10/sP50/sP90 cost all > 0 (fallback path)', () => {
    const cfg = buildConfig({ ...base, region: 'cis', sitecur: 'RUB', depcur: 'RUB', avgdep: 2000 });
    expect(cfg.econ.sP10.cost).toBeGreaterThan(0);
    expect(cfg.econ.sP50.cost).toBeGreaterThan(0);
    expect(cfg.econ.sP90.cost).toBeGreaterThan(0);
  });

  it('KZ sP50 cost > 0 (KZT fallback)', () => {
    const cfg = buildConfig({ ...base, region: 'cis', sitecur: 'KZT', depcur: 'KZT', avgdep: 20000 });
    expect(cfg.econ.sP50.cost).toBeGreaterThan(0);
  });

  it('MN sP10/sP50/sP90 cost all > 0 (MNT fallback)', () => {
    const cfg = buildConfig({ ...mn, avgdep: 100000 });
    expect(cfg.econ.sP10.cost).toBeGreaterThan(0);
    expect(cfg.econ.sP50.cost).toBeGreaterThan(0);
    expect(cfg.econ.sP90.cost).toBeGreaterThan(0);
  });
});
