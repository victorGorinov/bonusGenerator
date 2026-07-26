// Client mirror of src/domain/shared/RiskVector.ts — MUST stay in parity.
// Parity tests: tests/domain/{bonus,loyalty,tournament}.abuse.parity.test.js.
// Consumed in the browser via window.RetomatRisk (configurator.js is a classic script);
// also ESM-exported so the abuse mirrors + parity tests can import it directly.

export const SEVERITY_WEIGHT = { info: 0, warn: 12, high: 30, critical: 55 };

const SEVERITY_ORDER = { critical: 3, high: 2, warn: 1, info: 0 };
const SEVERITY_TO_LEVEL = { critical: 'critical', high: 'high', warn: 'elevated', info: 'low' };
const LEVEL_RANK = { low: 0, elevated: 1, high: 2, critical: 3 };

export function scoreVectors(vectors) {
  const sorted = [...vectors].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );
  const score = Math.min(
    100,
    sorted.reduce((s, v) => s + SEVERITY_WEIGHT[v.severity], 0),
  );
  let level = 'low';
  if (score >= 60) level = 'critical';
  else if (score >= 30) level = 'high';
  else if (score >= 12) level = 'elevated';
  if (sorted.length) {
    const floor = SEVERITY_TO_LEVEL[sorted[0].severity];
    if (LEVEL_RANK[floor] > LEVEL_RANK[level]) level = floor;
  }
  return { score, level, vectors: sorted };
}

if (typeof window !== 'undefined') {
  window.RetomatRisk = { scoreVectors, SEVERITY_WEIGHT };
}
