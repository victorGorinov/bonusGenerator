import { describe, it, expect } from 'vitest';
import { buildConfig }       from '../../src/domain/bonus/buildConfig.js';
import { CHAIN_PROGRESSION } from '../../src/domain/bonus/chainModel.js';

const base = { players: 5000, plat: 'both', rtp: 96 };

describe('CHAIN_PROGRESSION constants', () => {
  it('dep2 = 0.45', () => expect(CHAIN_PROGRESSION.dep2).toBe(0.45));
  it('dep3 = 0.25', () => expect(CHAIN_PROGRESSION.dep3).toBe(0.25));
  it('monotone: welcome ≥ dep2 ≥ dep3', () => {
    expect(1.0).toBeGreaterThanOrEqual(CHAIN_PROGRESSION.dep2);
    expect(CHAIN_PROGRESSION.dep2).toBeGreaterThanOrEqual(CHAIN_PROGRESSION.dep3);
  });
});

describe('chain block — EU/MGA', () => {
  const cfg = buildConfig({ ...base, region: 'eu', sitecur: 'EUR', depcur: 'EUR', avgdep: 100, lic: 'mga' });
  const ch  = cfg.econ.chain;

  it('chain block exists on econ', () => expect(ch).toBeDefined());
  it('has 3 steps', () => expect(ch.steps).toHaveLength(3));
  it('step keys are welcome/dep2/dep3', () => {
    expect(ch.steps[0].key).toBe('welcome');
    expect(ch.steps[1].key).toBe('dep2');
    expect(ch.steps[2].key).toBe('dep3');
  });
  it('welcome cohort = 1.0', () => expect(ch.steps[0].cohort).toBe(1.0));
  it('dep2 cohort = CHAIN_PROGRESSION.dep2', () => expect(ch.steps[1].cohort).toBe(CHAIN_PROGRESSION.dep2));
  it('dep3 cohort = CHAIN_PROGRESSION.dep3', () => expect(ch.steps[2].cohort).toBe(CHAIN_PROGRESSION.dep3));
  it('chainCost = sum of step costs', () => {
    const sum = ch.steps.reduce((s, step) => s + step.cost, 0);
    expect(ch.chainCost).toBe(sum);
  });
  it('chainCostRatio matches chainCost / (pl * dep)', () => {
    const expected = ch.chainCost / (cfg.econ.pl * cfg.dep);
    expect(ch.chainCostRatio).toBeCloseTo(expected, 3);
  });
  it('chainCostRatio > 0', () => expect(ch.chainCostRatio).toBeGreaterThan(0));
  it('chainMaxRisk > 0', () => expect(ch.chainMaxRisk).toBeGreaterThan(0));
  it('chainMaxRisk > econ.maxRisk (includes weighted dep2/dep3)', () => expect(ch.chainMaxRisk).toBeGreaterThan(cfg.econ.maxRisk));
  it('welcome step cost equals sP50.cost (same conv=0.20, cohort=1)', () => {
    expect(ch.steps[0].cost).toBe(cfg.econ.sP50.cost);
  });
});

describe('chain block — EU/UKGC', () => {
  const cfg = buildConfig({ ...base, region: 'eu', sitecur: 'GBP', depcur: 'GBP', avgdep: 80, lic: 'ukgc' });
  const ch  = cfg.econ.chain;

  it('chain exists', () => expect(ch).toBeDefined());
  it('chainCost = sum of steps', () => {
    const sum = ch.steps.reduce((s, step) => s + step.cost, 0);
    expect(ch.chainCost).toBe(sum);
  });
});

describe('chain block — CIS/RUB (payout-fallback path)', () => {
  const cfg = buildConfig({ ...base, region: 'cis', sitecur: 'RUB', depcur: 'RUB', avgdep: 5000, lic: 'none' });
  const ch  = cfg.econ.chain;

  it('chain exists', () => expect(ch).toBeDefined());
  it('chainCost is finite number', () => expect(isFinite(ch.chainCost)).toBe(true));
  it('chainCostRatio is finite', () => expect(isFinite(ch.chainCostRatio)).toBe(true));
  it('chainCost = sum of steps', () => {
    const sum = ch.steps.reduce((s, step) => s + step.cost, 0);
    expect(ch.chainCost).toBe(sum);
  });
});

describe('chain block — edge cases', () => {
  it('players omitted → defaults to 5000, chain still computes', () => {
    const cfg = buildConfig({ region: 'eu', sitecur: 'EUR', depcur: 'EUR', avgdep: 100, lic: 'mga', plat: 'both', rtp: 96 });
    expect(cfg.econ.pl).toBe(5000);
    const sum = cfg.econ.chain.steps.reduce((s, step) => s + step.cost, 0);
    expect(cfg.econ.chain.chainCost).toBe(sum);
  });

  it('sweep: dep2/dep3 are sc_purchase → chain costs only welcome', () => {
    const cfg = buildConfig({ ...base, region: 'sweep', sitecur: 'USD', depcur: 'USD', avgdep: 20, lic: 'none' });
    const ch  = cfg.econ.chain;
    expect(ch.steps[1].cost).toBe(0);
    expect(ch.steps[2].cost).toBe(0);
    expect(ch.chainCost).toBe(ch.steps[0].cost);
  });

  it('MNT: chain is valid (non-zero steps)', () => {
    const cfg = buildConfig({ ...base, region: 'mn', sitecur: 'MNT', depcur: 'MNT', avgdep: 50000, lic: 'none' });
    const ch  = cfg.econ.chain;
    expect(ch).toBeDefined();
    expect(ch.chainCost).toBeGreaterThanOrEqual(0);
    const sum = ch.steps.reduce((s, step) => s + step.cost, 0);
    expect(ch.chainCost).toBe(sum);
  });
});
