import { describe, it, expect } from 'vitest';
import { solveToTarget } from '../../public/balance-solver.js';

// Synthetic recalc: metric = draft.x (monotone)
const simpleRecalc = d => ({ metric: d.x });
const metricOf     = e => e.metric;

describe('solveToTarget — mul mode', () => {
  it('reaches target by multiplying lever up', () => {
    const draft  = { x: 1 };
    const levers = [{ p: 'x', mode: 'mul', f: 2, bounds: { min: 1, max: 1000 } }];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc: simpleRecalc, metricOf, target: 50 });
    expect(reached).toBe(true);
    expect(d.x).toBeGreaterThanOrEqual(50);
  });

  it('reaches target by multiplying lever down (f < 1 used to raise a cost ratio)', () => {
    // metric = 100 - draft.cost; reduce cost → raise metric
    const recalc = d => ({ metric: 100 - d.cost });
    const draft  = { cost: 80 };
    const levers = [{ p: 'cost', mode: 'mul', f: 0.8, bounds: { min: 1, max: 80 } }];
    const { reached } = solveToTarget({ draft, levers, recalc, metricOf, target: 60 });
    expect(reached).toBe(true);
  });

  it('reports reached:false when bounds prevent reaching target', () => {
    const draft  = { x: 1 };
    const levers = [{ p: 'x', mode: 'mul', f: 2, bounds: { min: 1, max: 4 } }];
    const { reached } = solveToTarget({ draft, levers, recalc: simpleRecalc, metricOf, target: 1000 });
    expect(reached).toBe(false);
  });
});

describe('solveToTarget — add mode', () => {
  it('reaches target by adding positive step', () => {
    const draft  = { x: 0 };
    const levers = [{ p: 'x', mode: 'add', f: 10, bounds: { min: 0, max: 500 } }];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc: simpleRecalc, metricOf, target: 100 });
    expect(reached).toBe(true);
    expect(d.x).toBe(100);
  });

  it('isInt rounds values correctly', () => {
    const draft  = { x: 0 };
    const levers = [{ p: 'x', mode: 'add', f: 1.7, bounds: { min: 0, max: 100 }, isInt: true }];
    const { draft: d } = solveToTarget({ draft, levers, recalc: simpleRecalc, metricOf, target: 5 });
    expect(Number.isInteger(d.x)).toBe(true);
  });
});

describe('solveToTarget — enum mode', () => {
  it('cycles through enum in order', () => {
    const recalc = d => ({ metric: ['a','b','c','d'].indexOf(d.mode) * 30 });
    const draft  = { mode: 'a' };
    const levers = [{ p: 'mode', mode: 'enum', enum: ['a','b','c','d'] }];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc, metricOf, target: 60 });
    expect(reached).toBe(true);
    expect(d.mode).toBe('c');
  });

  it('reports reached:false when enum is exhausted', () => {
    const recalc = d => ({ metric: ['a','b'].indexOf(d.mode) * 5 });
    const draft  = { mode: 'a' };
    const levers = [{ p: 'mode', mode: 'enum', enum: ['a','b'] }];
    const { reached } = solveToTarget({ draft, levers, recalc, metricOf, target: 100 });
    expect(reached).toBe(false);
  });
});

describe('solveToTarget — general behaviour', () => {
  it('does not mutate the original draft', () => {
    const draft  = { x: 1 };
    const levers = [{ p: 'x', mode: 'mul', f: 2, bounds: { min: 1, max: 1000 } }];
    solveToTarget({ draft, levers, recalc: simpleRecalc, metricOf, target: 50 });
    expect(draft.x).toBe(1);
  });

  it('respects maxIter guard', () => {
    let calls = 0;
    const recalc = d => { calls++; return { metric: d.x }; };
    const draft  = { x: 0 };
    const levers = [{ p: 'x', mode: 'add', f: 1, bounds: { min: 0, max: 1_000_000 } }];
    solveToTarget({ draft, levers, recalc, metricOf, target: 1_000_000, maxIter: 10 });
    // Should not loop more than maxIter + 1 times (initial eval + maxIter)
    expect(calls).toBeLessThanOrEqual(12);
  });

  it('multi-lever: tries levers in priority order', () => {
    // lever[0] capped, lever[1] available
    const recalc = d => ({ metric: d.y });
    const draft  = { x: 10, y: 0 };
    const levers = [
      { p: 'x', mode: 'add', f: 5, bounds: { min: 0, max: 10 } }, // already at max
      { p: 'y', mode: 'add', f: 10, bounds: { min: 0, max: 1000 } },
    ];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc, metricOf, target: 30 });
    expect(reached).toBe(true);
    expect(d.x).toBe(10); // untouched — was already at max
    expect(d.y).toBeGreaterThanOrEqual(30);
  });
});

describe('solveToTarget — constraints', () => {
  it('constraint blocks a lever step that would violate it', () => {
    // lever tries to raise x above 5, but constraint caps at 5
    const recalc = d => ({ metric: d.x });
    const draft  = { x: 3 };
    const levers = [{ p: 'x', mode: 'add', f: 1, bounds: { min: 0, max: 100 } }];
    const constraints = [{ check: (d) => d.x <= 5 }];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc, metricOf: e => e.metric, target: 50, constraints });
    expect(reached).toBe(false);
    expect(d.x).toBeLessThanOrEqual(5);
  });

  it('returns reached:false when target is unreachable due to constraints', () => {
    const recalc = d => ({ metric: d.x });
    const draft  = { x: 1 };
    const levers = [{ p: 'x', mode: 'add', f: 10, bounds: { min: 0, max: 1000 } }];
    const constraints = [{ check: (d) => d.x <= 20 }];
    const { reached } = solveToTarget({ draft, levers, recalc, metricOf: e => e.metric, target: 100, constraints });
    expect(reached).toBe(false);
  });

  it('enum lever is rolled back when constraint fails', () => {
    // enum cycles a→b→c; constraint blocks 'c'
    const recalc = d => ({ metric: ['a','b','c'].indexOf(d.mode) * 50 });
    const draft  = { mode: 'a' };
    const levers = [{ p: 'mode', mode: 'enum', enum: ['a','b','c'] }];
    const constraints = [{ check: (d) => d.mode !== 'c' }];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc, metricOf: e => e.metric, target: 150, constraints });
    expect(reached).toBe(false);
    expect(d.mode).toBe('b');
  });

  it('allows step when constraint passes', () => {
    const recalc = d => ({ metric: d.x });
    const draft  = { x: 0 };
    const levers = [{ p: 'x', mode: 'add', f: 5, bounds: { min: 0, max: 100 } }];
    const constraints = [{ check: (d) => d.x <= 30 }];
    const { reached, draft: d } = solveToTarget({ draft, levers, recalc, metricOf: e => e.metric, target: 25, constraints });
    expect(reached).toBe(true);
    expect(d.x).toBeLessThanOrEqual(30);
  });

  it('passes cfg context to constraint check', () => {
    const recalc = d => ({ metric: d.x });
    const draft  = { x: 0 };
    const levers = [{ p: 'x', mode: 'add', f: 1, bounds: { min: 0, max: 100 } }];
    const cfg = { cap: 7 };
    const constraints = [{ check: (d, ctx) => d.x <= ctx.cap }];
    const { draft: d } = solveToTarget({ draft, levers, recalc, metricOf: e => e.metric, target: 1000, constraints, cfg });
    expect(d.x).toBeLessThanOrEqual(7);
  });
});
