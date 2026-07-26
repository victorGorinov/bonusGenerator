import { describe, it, expect } from 'vitest';
import { assessTournamentAbuse } from '../../src/domain/tournament/abuseRisk.js';

const P = (over = {}) => ({ entryModel: 'buyin', scoring: 'total_wins', reentry: 'single', segment: 'depositors', ...over });
const E = (over = {}) => ({ participantsMid: 500, eligible: 3000, prizePoolCost: 5000, ...over });
const find = (a, k) => a.vectors.find((v) => v.key === k);

describe('assessTournamentAbuse — freeroll EV', () => {
  it('flags high for a small-field freeroll', () => {
    const a = assessTournamentAbuse(P({ entryModel: 'freeroll' }), E({ participantsMid: 120 }));
    expect(find(a, 'ev_positive_freeroll').severity).toBe('high');
  });

  it('flags warn for a large-field freeroll', () => {
    const a = assessTournamentAbuse(P({ entryModel: 'freeroll' }), E({ participantsMid: 800 }));
    expect(find(a, 'ev_positive_freeroll').severity).toBe('warn');
  });

  it('does not flag a buy-in tournament as EV freeroll', () => {
    const a = assessTournamentAbuse(P({ entryModel: 'buyin' }), E());
    expect(find(a, 'ev_positive_freeroll')).toBeUndefined();
  });
});

describe('assessTournamentAbuse — structural vectors', () => {
  it('flags multi-account magnet for open freeroll on segment=all, high with unlimited reentry', () => {
    const warn = assessTournamentAbuse(P({ entryModel: 'freeroll', segment: 'all', reentry: 'single' }), E());
    expect(find(warn, 'multiaccount_magnet').severity).toBe('warn');
    const high = assessTournamentAbuse(P({ entryModel: 'freeroll', segment: 'all', reentry: 'unlimited' }), E());
    expect(find(high, 'multiaccount_magnet').severity).toBe('high');
  });

  it('flags spin-count grinding as high, total-wins as warn', () => {
    const spins = assessTournamentAbuse(P({ scoring: 'most_spins' }), E());
    expect(find(spins, 'turnover_grind').severity).toBe('high');
    const wins = assessTournamentAbuse(P({ scoring: 'total_wins' }), E());
    expect(find(wins, 'turnover_grind').severity).toBe('warn');
  });

  it('flags variance abuse for highest_multiplier with repeatable entry', () => {
    const a = assessTournamentAbuse(P({ scoring: 'highest_multiplier', reentry: 'rebuy' }), E());
    expect(find(a, 'variance_abuse').severity).toBe('warn');
    const single = assessTournamentAbuse(P({ scoring: 'highest_multiplier', reentry: 'single' }), E());
    expect(find(single, 'variance_abuse')).toBeUndefined();
  });

  it('flags unbounded re-entry on a paid tournament', () => {
    const a = assessTournamentAbuse(P({ entryModel: 'buyin', reentry: 'unlimited' }), E());
    expect(find(a, 'reentry_unbounded').severity).toBe('warn');
  });

  it('is quiet on a gated, net-scored, single-entry buy-in', () => {
    const a = assessTournamentAbuse(P({ entryModel: 'buyin', scoring: 'mission_based', reentry: 'single', segment: 'vip' }), E());
    expect(a.level).toBe('low');
    expect(a.vectors).toHaveLength(0);
  });
});
