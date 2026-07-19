// Parity: public/bonus-benchmarks.js must match src/config/benchmarks/bonusBenchmarks.ts
// for identical (param, region, license) — bands, caps, states, regulatory notes.

import { describe, it, expect } from 'vitest';
import * as srv from '../../src/config/benchmarks/bonusBenchmarks.js';
import * as cli from '../../public/bonus-benchmarks.js';

const PARAMS   = ['w_wager', 'rl_wager', 'ndb_wager', 'w_pct', 'rl_pct', 'w_maxB'];
const REGIONS  = ['eu', 'cis', 'crypto', 'latam', 'mn', 'sweep'];
const LICENSES = ['mga', 'ukgc', 'dga', 'none', 'bets_br', 'segob', 'coljuegos', 'mincetur'];
const MECHANICS = ['welcome', 'ndb', 'reload', 'dep2'];

describe('bonus-benchmarks.js parity with bonusBenchmarks.ts', () => {
  it('getBenchmark matches across the full param × region × license matrix', () => {
    for (const param of PARAMS) {
      for (const region of REGIONS) {
        for (const license of LICENSES) {
          const s = srv.getBenchmark(param, region, license);
          const c = cli.getBenchmark(param, region, license);
          expect(c, `${param}/${region}/${license}`).toEqual(s);
        }
      }
    }
  });

  it('classifyValue matches for boundary + interior values', () => {
    const cases = [
      ['w_wager', 'eu', 'mga'],
      ['w_wager', 'eu', 'ukgc'],
      ['w_wager', 'latam', 'coljuegos'],
      ['ndb_wager', 'eu', 'dga'],
      ['w_pct', 'eu', 'mga'],
    ];
    for (const [param, region, license] of cases) {
      const s = srv.getBenchmark(param, region, license);
      const c = cli.getBenchmark(param, region, license);
      const probes = [0, 1, 5, 10, 20, 30, 35, 40, 45, 50, 100, 200, 250];
      for (const v of probes) {
        expect(cli.classifyValue(v, c), `${param}/${region}/${license}@${v}`)
          .toBe(srv.classifyValue(v, s));
      }
    }
  });

  it('regulatoryNote matches across license × mechanic', () => {
    for (const license of LICENSES) {
      for (const mechanic of MECHANICS) {
        expect(cli.regulatoryNote(license, mechanic), `${license}/${mechanic}`)
          .toBe(srv.regulatoryNote(license, mechanic));
      }
    }
  });

  it('sanity: known regulatory facts', () => {
    // UKGC caps welcome wager at 10x
    const uk = srv.getBenchmark('w_wager', 'eu', 'ukgc');
    expect(uk.band.max).toBe(10);
    expect(uk.cap.max).toBe(10);
    expect(srv.classifyValue(35, uk)).toBe('over_cap');
    // BR welcome → prohibition warning
    expect(srv.regulatoryNote('bets_br', 'welcome')).toBe('reg_warn_br_welcome');
    expect(srv.regulatoryNote('bets_br', 'reload')).toBe('reg_warn_br_soft');
    // Colombia welcome wager rec lower (restrictive)
    expect(srv.getBenchmark('w_wager', 'latam', 'coljuegos').band.rec).toBe(30);
    // NDB wager rec adjusted to 35
    expect(srv.getBenchmark('ndb_wager', 'eu', 'mga').band.rec).toBe(35);
  });
});
