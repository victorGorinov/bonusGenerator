// Client mirror of src/domain/tournament/abuseRisk.ts — MUST stay in parity.
// Parity test: tests/domain/tournament.abuse.parity.test.js.
// Browser: window.RetomatTournamentAbuse (configurator.js is a classic script); also ESM-exported.

import { scoreVectors } from './risk-vector.js';

export function assessTournamentAbuse(params, econ) {
  const vectors = [];
  const entry = params.entryModel || '';
  const scoring = params.scoring || '';
  const reentry = params.reentry || '';
  const segment = params.segment || '';
  const isFree = entry === 'freeroll' || entry === 'ticket';
  const participants = Math.max(0, econ.participantsMid ?? 0);

  if (isFree && (econ.prizePoolCost ?? 0) > 0) {
    if (participants > 0 && participants < 300) {
      vectors.push({ key: 'ev_positive_freeroll', severity: 'high', current: participants, threshold: 300, mitigationKey: 'abuse_mit_trn_freeroll' });
    } else {
      vectors.push({ key: 'ev_positive_freeroll', severity: 'warn', current: participants, threshold: 300, mitigationKey: 'abuse_mit_trn_freeroll' });
    }
  }

  if (isFree && segment === 'all') {
    const sev = reentry === 'unlimited' ? 'high' : 'warn';
    vectors.push({ key: 'multiaccount_magnet', severity: sev, current: segment, threshold: 'gate segment', mitigationKey: 'abuse_mit_trn_multiacct' });
  }

  if (scoring === 'most_spins') {
    vectors.push({ key: 'turnover_grind', severity: 'high', current: scoring, threshold: 'net-based scoring', mitigationKey: 'abuse_mit_trn_grind' });
  } else if (scoring === 'total_wins') {
    vectors.push({ key: 'turnover_grind', severity: 'warn', current: scoring, threshold: 'net-based scoring', mitigationKey: 'abuse_mit_trn_grind' });
  }

  if (scoring === 'highest_multiplier' && reentry !== 'single' && reentry !== '') {
    vectors.push({ key: 'variance_abuse', severity: 'warn', current: reentry, threshold: 'single', mitigationKey: 'abuse_mit_trn_variance' });
  }

  if (reentry === 'unlimited' && !isFree) {
    vectors.push({ key: 'reentry_unbounded', severity: 'warn', current: reentry, threshold: 'cap re-entries', mitigationKey: 'abuse_mit_trn_reentry' });
  }

  return scoreVectors(vectors);
}

if (typeof window !== 'undefined') {
  window.RetomatTournamentAbuse = { assessTournamentAbuse };
}
