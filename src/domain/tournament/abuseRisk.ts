// Tournament abuse / anti-fraud risk assessment — deterministic, no AI.
//
// Anchors: a free-entry tournament with a guaranteed prize pool is EV-positive to enter
// (prize-EV per participant > 0 at zero entry cost) — and the smaller the eligible field,
// the more concentrated (and farmable) that EV is. Layered on top: multi-accounting on
// open freerolls, turnover/spin-count grinding of the leaderboard, and max-variance chasing
// under unbounded re-entry.
//
// Thresholds are researched defaults (documented inline).
// Browser mirror: public/tournament-abuse.js (window.RetomatTournamentAbuse), parity-tested.

import { RiskVector, RiskAssessment, scoreVectors } from '../shared/RiskVector.js';

export interface TournamentAbuseParams {
  entryModel?: string; // 'freeroll' | 'buyin' | 'ticket'
  scoring?: string;    // 'total_wins' | 'highest_multiplier' | 'most_spins' | 'mission_based'
  reentry?: string;    // 'single' | 'rebuy' | 'unlimited'
  segment?: string;    // 'all' | 'new' | 'vip' | 'dormant' | 'depositors'
}

export interface TournamentAbuseEcon {
  participantsMid?: number;
  eligible?: number;
  prizePoolCost?: number;
}

export function assessTournamentAbuse(
  params: TournamentAbuseParams,
  econ: TournamentAbuseEcon,
): RiskAssessment {
  const vectors: RiskVector[] = [];
  const entry = params.entryModel || '';
  const scoring = params.scoring || '';
  const reentry = params.reentry || '';
  const segment = params.segment || '';
  const isFree = entry === 'freeroll' || entry === 'ticket';
  const participants = Math.max(0, econ.participantsMid ?? 0);

  // ── 1. EV-positive freeroll, concentration by field size ────────────────────
  if (isFree && (econ.prizePoolCost ?? 0) > 0) {
    if (participants > 0 && participants < 300) {
      // Small field → few accounts can dominate the guaranteed pool.
      vectors.push({ key: 'ev_positive_freeroll', severity: 'high', current: participants, threshold: 300, mitigationKey: 'abuse_mit_trn_freeroll' });
    } else {
      vectors.push({ key: 'ev_positive_freeroll', severity: 'warn', current: participants, threshold: 300, mitigationKey: 'abuse_mit_trn_freeroll' });
    }
  }

  // ── 2. Multi-accounting magnet: open freeroll to everyone ───────────────────
  if (isFree && segment === 'all') {
    const sev = reentry === 'unlimited' ? 'high' : 'warn';
    vectors.push({ key: 'multiaccount_magnet', severity: sev, current: segment, threshold: 'gate segment', mitigationKey: 'abuse_mit_trn_multiacct' });
  }

  // ── 3. Turnover / spin-count grinding of the leaderboard ────────────────────
  if (scoring === 'most_spins') {
    vectors.push({ key: 'turnover_grind', severity: 'high', current: scoring, threshold: 'net-based scoring', mitigationKey: 'abuse_mit_trn_grind' });
  } else if (scoring === 'total_wins') {
    vectors.push({ key: 'turnover_grind', severity: 'warn', current: scoring, threshold: 'net-based scoring', mitigationKey: 'abuse_mit_trn_grind' });
  }

  // ── 4. Max-variance chasing under repeatable entry ──────────────────────────
  if (scoring === 'highest_multiplier' && reentry !== 'single' && reentry !== '') {
    vectors.push({ key: 'variance_abuse', severity: 'warn', current: reentry, threshold: 'single', mitigationKey: 'abuse_mit_trn_variance' });
  }

  // ── 5. Unbounded re-entry on a paid tournament (deep-pocket dominance) ───────
  if (reentry === 'unlimited' && !isFree) {
    vectors.push({ key: 'reentry_unbounded', severity: 'warn', current: reentry, threshold: 'cap re-entries', mitigationKey: 'abuse_mit_trn_reentry' });
  }

  return scoreVectors(vectors);
}
