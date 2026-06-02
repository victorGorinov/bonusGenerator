// Tests for regulatory constraints in the bonus balance solver.
// Verifies that solveToTarget respects license wager caps (UKGC=10×, DGA=25×, none=50×).

import { describe, it, expect } from 'vitest';
import { solveToTarget }        from '../../public/balance-solver.js';
import { buildConfig }          from '../../src/domain/bonus/buildConfig.js';
import { recalcBonusEconLocal, buildRegConstraints, getLicenseWagerCap } from '../../public/bonus-cost.js';

// Levers mirror BONUS_LEVERS from configurator-extra.js
const BONUS_LEVERS = [
  { p: 'wager',       mode: 'add',  f: +5,  bounds: { min: 1,  max: 200 } },
  { p: 'addFS',       mode: 'enum', enum: [true, false] },
  { p: 'addCashback', mode: 'enum', enum: [true, false] },
  { p: 'addReload',   mode: 'enum', enum: [true, false] },
  { p: 'matchPct',    mode: 'add',  f: -10, bounds: { min: 0,  max: 200 } },
];

const metricOf = e => e.netIncr;

// Build a "generous" draft that starts with low wager so solver will try to raise it
function makeStartDraft(cfg, lic) {
  return {
    wager:       cfg.econ.wagerX || 10,
    matchPct:    (cfg.welcome && cfg.welcome.pct) || 100,
    addFS:       true,
    addCashback: true,
    addReload:   true,
    segment:     'mid',
    plat:        'both',
  };
}

describe('regulatory constraints — wager cap', () => {
  it('getLicenseWagerCap returns correct caps', () => {
    expect(getLicenseWagerCap('ukgc')).toBe(10);
    expect(getLicenseWagerCap('dga')).toBe(25);
    expect(getLicenseWagerCap('mga')).toBe(50);
    expect(getLicenseWagerCap('none')).toBe(50);
    expect(getLicenseWagerCap('unknown')).toBe(50);
  });

  it('UKGC: solver never raises wager above 10×', () => {
    const cfg = buildConfig({ region: 'eu', sitecur: 'GBP', depcur: 'GBP', players: 2000, avgdep: 80, plat: 'both', rtp: 96, lic: 'ukgc' });
    const draft       = makeStartDraft(cfg, 'ukgc');
    const constraints = buildRegConstraints(cfg);
    const recalc      = d => recalcBonusEconLocal(cfg, d);

    // Set an unreachably high target so the solver exhausts all levers
    const { draft: d } = solveToTarget({ draft, levers: BONUS_LEVERS, recalc, metricOf, target: 1e9, constraints, cfg, maxIter: 200 });

    expect(d.wager).toBeLessThanOrEqual(getLicenseWagerCap('ukgc'));
  });

  it('DGA: solver never raises wager above 25×', () => {
    const cfg = buildConfig({ region: 'eu', sitecur: 'DKK', depcur: 'DKK', players: 3000, avgdep: 200, plat: 'both', rtp: 96, lic: 'dga' });
    const draft       = makeStartDraft(cfg, 'dga');
    const constraints = buildRegConstraints(cfg);
    const recalc      = d => recalcBonusEconLocal(cfg, d);

    const { draft: d } = solveToTarget({ draft, levers: BONUS_LEVERS, recalc, metricOf, target: 1e9, constraints, cfg, maxIter: 200 });

    expect(d.wager).toBeLessThanOrEqual(getLicenseWagerCap('dga'));
  });

  it('none (CIS): solver never raises wager above 50×', () => {
    const cfg = buildConfig({ region: 'cis', sitecur: 'RUB', depcur: 'RUB', players: 5000, avgdep: 5000, plat: 'mobile', rtp: 95, lic: 'none' });
    const draft       = makeStartDraft(cfg, 'none');
    const constraints = buildRegConstraints(cfg);
    const recalc      = d => recalcBonusEconLocal(cfg, d);

    const { draft: d } = solveToTarget({ draft, levers: BONUS_LEVERS, recalc, metricOf, target: 1e9, constraints, cfg, maxIter: 200 });

    expect(d.wager).toBeLessThanOrEqual(50);
  });

  it('UKGC with generous config: either reaches netIncr>=0 within cap OR returns reached:false', () => {
    // Generous config: high players, good ARPU — may or may not reach breakeven within cap
    const cfg = buildConfig({ region: 'eu', sitecur: 'GBP', depcur: 'GBP', players: 10000, avgdep: 80, plat: 'both', rtp: 96, lic: 'ukgc' });
    const draft       = makeStartDraft(cfg, 'ukgc');
    const constraints = buildRegConstraints(cfg);
    const recalc      = d => recalcBonusEconLocal(cfg, d);

    const { reached, draft: d, econ } = solveToTarget({ draft, levers: BONUS_LEVERS, recalc, metricOf, target: 0, constraints, cfg, maxIter: 200 });

    // Regardless of outcome: wager must respect the cap
    expect(d.wager).toBeLessThanOrEqual(getLicenseWagerCap('ukgc'));

    if (reached) {
      expect(econ.netIncr).toBeGreaterThanOrEqual(0);
    }
    // If not reached — that's an honest result (cannot balance within regulatory limits)
  });

  it('MGA: solver respects 50× sanity ceiling', () => {
    const cfg = buildConfig({ region: 'eu', sitecur: 'EUR', depcur: 'EUR', players: 5000, avgdep: 100, plat: 'both', rtp: 96, lic: 'mga' });
    const draft       = { ...makeStartDraft(cfg, 'mga'), wager: 1 }; // start at 1 to force upward motion
    const constraints = buildRegConstraints(cfg);
    const recalc      = d => recalcBonusEconLocal(cfg, d);

    const { draft: d } = solveToTarget({ draft, levers: BONUS_LEVERS, recalc, metricOf, target: 1e9, constraints, cfg, maxIter: 200 });

    expect(d.wager).toBeLessThanOrEqual(50);
  });
});
