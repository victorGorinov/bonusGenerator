// Shared shape for bonus-abuse / anti-fraud risk assessment across all promo types.
//
// The concept ("an EV-positive configuration gets farmed") is common to Bonus,
// Loyalty and Tournament, but the *vectors* and *anchors* differ per type — so each
// domain has its own `abuseRisk.ts` engine that emits these shared vectors, and this
// module owns the scoring/leveling that turns a vector list into a single assessment.
//
// Browser mirror: public/risk-vector.js (window.RetomatRisk), parity-tested.

export type Severity = 'info' | 'warn' | 'high' | 'critical';
export type RiskLevel = 'low' | 'elevated' | 'high' | 'critical';

export interface RiskVector {
  /** Stable vector id, also the i18n key stem (e.g. 'ev_positive'). */
  key: string;
  severity: Severity;
  /** Observed value that triggered the flag (for explainability). */
  current?: number | string;
  /** The line it crossed. */
  threshold?: number | string;
  /** i18n key for the mitigation recommendation. */
  mitigationKey: string;
}

export interface RiskAssessment {
  /** 0..100 aggregate, capped. */
  score: number;
  level: RiskLevel;
  /** Vectors sorted most-severe first. `info` vectors are safeguard notes (weight 0). */
  vectors: RiskVector[];
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  info: 0,
  warn: 12,
  high: 30,
  critical: 55,
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 3, high: 2, warn: 1, info: 0 };
const SEVERITY_TO_LEVEL: Record<Severity, RiskLevel> = {
  critical: 'critical', high: 'high', warn: 'elevated', info: 'low',
};
const LEVEL_RANK: Record<RiskLevel, number> = { low: 0, elevated: 1, high: 2, critical: 3 };

/** Aggregate a vector list into a scored, leveled, sorted assessment. */
export function scoreVectors(vectors: RiskVector[]): RiskAssessment {
  const sorted = [...vectors].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );
  const score = Math.min(
    100,
    sorted.reduce((s, v) => s + SEVERITY_WEIGHT[v.severity], 0),
  );
  let level: RiskLevel = 'low';
  if (score >= 60) level = 'critical';
  else if (score >= 30) level = 'high';
  else if (score >= 12) level = 'elevated';
  // Floor the level to the single most-severe vector so one lone `critical` finding (score 55,
  // below the cumulative 60 cutoff) never reads as merely "high" in an anti-fraud panel.
  if (sorted.length) {
    const floor = SEVERITY_TO_LEVEL[sorted[0].severity];
    if (LEVEL_RANK[floor] > LEVEL_RANK[level]) level = floor;
  }
  return { score, level, vectors: sorted };
}
