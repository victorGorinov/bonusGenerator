// Parity: public/tournament-abuse.js must match src/domain/tournament/abuseRisk.ts.
import { describe, it, expect } from 'vitest';
import { assessTournamentAbuse as srv } from '../../src/domain/tournament/abuseRisk.js';
import { assessTournamentAbuse as cli } from '../../public/tournament-abuse.js';

const CASES = [];
for (const entryModel of ['freeroll', 'buyin', 'ticket']) {
  for (const scoring of ['total_wins', 'highest_multiplier', 'most_spins', 'mission_based']) {
    for (const reentry of ['single', 'rebuy', 'unlimited']) {
      for (const segment of ['all', 'vip', 'depositors']) {
        for (const participantsMid of [0, 120, 500, 800]) {
          CASES.push([
            { entryModel, scoring, reentry, segment },
            { participantsMid, eligible: 3000, prizePoolCost: 5000 },
          ]);
        }
      }
    }
  }
}

describe('tournament-abuse.js parity with abuseRisk.ts', () => {
  it('matches across the full params × econ matrix', () => {
    for (const [p, e] of CASES) {
      expect(cli(p, e), JSON.stringify({ p, e })).toEqual(srv(p, e));
    }
  });
});
