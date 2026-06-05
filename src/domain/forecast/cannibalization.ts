/**
 * Deterministic cannibalization model for overlapping retention activities.
 *
 * Keep in sync with public/forecast.js
 */

import type { NormalizedActivity, CampaignType } from './normalizeCampaign.js';

// Symmetric affinity matrix: 0 = no competition, 1 = full cannibalization.
// Expert-calibrated starting values; tuning on real data is P4.
export const MECHANIC_AFFINITY: Record<CampaignType, Record<CampaignType, number>> = {
  reload:       { reload:0.9, tournament:0.7, cashback:0.5, freespins:0.5, vip:0.4, reactivation:0.3, sportsbook:0.4, custom:0.3 },
  tournament:   { reload:0.7, tournament:0.9, cashback:0.4, freespins:0.5, vip:0.5, reactivation:0.3, sportsbook:0.5, custom:0.3 },
  cashback:     { reload:0.5, tournament:0.4, cashback:0.9, freespins:0.4, vip:0.4, reactivation:0.3, sportsbook:0.3, custom:0.3 },
  freespins:    { reload:0.5, tournament:0.5, cashback:0.4, freespins:0.9, vip:0.3, reactivation:0.4, sportsbook:0.2, custom:0.3 },
  vip:          { reload:0.4, tournament:0.5, cashback:0.4, freespins:0.3, vip:0.9, reactivation:0.2, sportsbook:0.3, custom:0.3 },
  reactivation: { reload:0.3, tournament:0.3, cashback:0.3, freespins:0.4, vip:0.2, reactivation:0.9, sportsbook:0.2, custom:0.3 },
  sportsbook:   { reload:0.4, tournament:0.5, cashback:0.3, freespins:0.2, vip:0.3, reactivation:0.2, sportsbook:0.9, custom:0.3 },
  custom:       { reload:0.3, tournament:0.3, cashback:0.3, freespins:0.3, vip:0.3, reactivation:0.3, sportsbook:0.3, custom:0.5 },
};

// Mirrors SEGMENT_RATIO in tournament-econ.js
const SEGMENT_RATIO: Record<string, number> = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

/**
 * Fraction of shared audience between two activities [0..1].
 * - Same segment → 1.0
 * - One is 'all' → the other's ratio (it's a subset of 'all')
 * - Different concrete segments → 0 (disjoint)
 */
export function audienceOverlap(a: NormalizedActivity, b: NormalizedActivity): number {
  const sa = a.segment;
  const sb = b.segment;
  if (sa === sb) return 1.0;
  if (sa === 'all') return SEGMENT_RATIO[sb] ?? 0;
  if (sb === 'all') return SEGMENT_RATIO[sa] ?? 0;
  return 0;
}

/**
 * Returns the proportion of days in the shorter campaign that overlap [0..1].
 */
export function overlapDaysFactor(a: NormalizedActivity, b: NormalizedActivity): number {
  const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
  const overlapEnd   = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
  if (overlapStart > overlapEnd) return 0;

  const overlapMs  = Date.parse(overlapEnd)   - Date.parse(overlapStart)   + 86_400_000;
  const aDurationMs = Date.parse(a.endDate)   - Date.parse(a.startDate)    + 86_400_000;
  const bDurationMs = Date.parse(b.endDate)   - Date.parse(b.startDate)    + 86_400_000;
  const minDuration = Math.min(aDurationMs, bDurationMs);

  return Math.min(1, overlapMs / minDuration);
}

export interface ForecastPair {
  aId: string;
  bId: string;
  aTitle: string;
  bTitle: string;
  loss: number;
  audienceOverlap: number;
  affinity: number;
  reason: string;
}

/**
 * Cannibalization loss for a pair of overlapping activities.
 * Applied to the weaker (smaller incrementalRevenue) of the two.
 * Returns 0 when either activity lacks econ data.
 */
export function pairCannibalization(
  a: NormalizedActivity,
  b: NormalizedActivity,
): ForecastPair {
  if (!a.hasEcon || !b.hasEcon) {
    return { aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title,
             loss: 0, audienceOverlap: 0, affinity: 0, reason: '' };
  }

  const overlap  = audienceOverlap(a, b);
  const daysFactor = overlapDaysFactor(a, b);

  if (overlap === 0 || daysFactor === 0) {
    return { aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title,
             loss: 0, audienceOverlap: overlap, affinity: 0, reason: '' };
  }

  const aType = (a.type ?? 'custom') as CampaignType;
  const bType = (b.type ?? 'custom') as CampaignType;
  const affinityRow = MECHANIC_AFFINITY[aType] ?? MECHANIC_AFFINITY.custom;
  const affinity    = affinityRow[bType]        ?? 0.3;

  const minRev = Math.min(a.incrementalRevenue, b.incrementalRevenue);
  const loss   = Math.round(minRev * overlap * affinity * daysFactor);

  const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
  const overlapEnd   = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
  const overlapDays  = Math.round((Date.parse(overlapEnd) - Date.parse(overlapStart)) / 86_400_000) + 1;
  const seg = a.segment === b.segment ? a.segment : `${a.segment}+${b.segment}`;
  const reason = `${aType} × ${bType} on ${seg}, ${overlapDays} shared day${overlapDays !== 1 ? 's' : ''}`;

  return { aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title,
           loss, audienceOverlap: overlap, affinity, reason };
}
