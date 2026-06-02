/**
 * Generic deterministic solver for balancing economic parameters to a target metric.
 * Used by Tournament Generator, Loyalty Generator, and Bonus Configurator.
 *
 * Levers format:
 *   { p: string, mode: 'mul'|'add'|'enum', f?: number, bounds?: {min,max}, enum?: string[], isInt?: boolean }
 *
 * - 'mul': next = current * f  (f < 1 to reduce, f > 1 to increase)
 * - 'add': next = current + f  (negative f to reduce)
 * - 'enum': cycles through enum[] from first to last (one step per call)
 *
 * Levers are tried in priority order; first lever that can move wins.
 *
 * Constraints format:
 *   [{ check(draft, cfg) => bool }]
 * A lever step is rolled back if any constraint returns false after the step.
 * cfg is an optional extra context object passed through from solveToTarget.
 */

function _stepLever(draft, L, constraints, cfg) {
  if (L.mode === 'enum') {
    const arr = L.enum || [];
    const idx = arr.indexOf(draft[L.p]);
    const nextIdx = idx + 1;
    if (nextIdx >= arr.length) return false;
    const prev = draft[L.p];
    draft[L.p] = arr[nextIdx];
    if (constraints && constraints.length > 0) {
      for (const c of constraints) {
        if (!c.check(draft, cfg)) {
          draft[L.p] = prev;
          return false;
        }
      }
    }
    return true;
  }

  const b   = L.bounds;
  const cur = draft[L.p];
  const raw = L.mode === 'mul' ? cur * L.f : cur + L.f;
  const clamped = b ? Math.max(b.min, Math.min(b.max, raw)) : raw;
  const val = L.isInt ? Math.round(clamped) : clamped;

  if (Math.abs(val - cur) < 1e-9) return false;
  draft[L.p] = val;

  if (constraints && constraints.length > 0) {
    for (const c of constraints) {
      if (!c.check(draft, cfg)) {
        draft[L.p] = cur;
        return false;
      }
    }
  }
  return true;
}

/**
 * Runs the solver loop.
 *
 * @param {object} opts
 * @param {object}   opts.draft       - mutable parameter object (will be cloned)
 * @param {Array}    opts.levers      - lever descriptors, tried in order
 * @param {Function} opts.recalc     - (draft) => econ  (pure, no side effects)
 * @param {Function} opts.metricOf   - (econ)  => number
 * @param {number}   opts.target     - target metric value
 * @param {Array}    [opts.constraints] - constraint descriptors: [{ check(draft, cfg) => bool }]
 * @param {*}        [opts.cfg]      - extra context passed to constraint checks
 * @param {number}   [opts.maxIter=60]
 * @returns {{ econ, draft, reached: boolean }}
 */
export function solveToTarget({ draft, levers, recalc, metricOf, target, constraints = [], cfg = null, maxIter = 60 }) {
  const d = { ...draft };
  let econ  = recalc(d);
  let guard = 0;

  while (metricOf(econ) < target && guard++ < maxIter) {
    let moved = false;
    for (const L of levers) {
      if (_stepLever(d, L, constraints, cfg)) { moved = true; break; }
    }
    if (!moved) break;
    econ = recalc(d);
  }

  return { econ, draft: d, reached: metricOf(econ) >= target };
}

// Browser global for non-module scripts
if (typeof window !== 'undefined') {
  window._balanceSolver = { solveToTarget };
}
