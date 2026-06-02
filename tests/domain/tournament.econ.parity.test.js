/**
 * Parity test: client-side tournament-econ.js must produce the same result
 * as the server-side calcTournamentEconomics() for the same inputs.
 *
 * Checks: roi, netMarginMid, ggrLiftMid, costPerActiveMid, retentionValue, prizePoolCost
 */

import { describe, it, expect } from 'vitest';
import { calcTournamentEconomics as serverCalc } from '../../src/domain/tournament/calcEconomics.js';
import { calcTournamentEconomics as clientCalc } from '../../public/tournament-econ.js';

const CASES = [
  {
    label: 'EU weekly fixed',
    params: { region:'eu', segment:'all',      duration:'weekly',      prizePool:1000, poolModel:'fixed',   rake:0,  totalPlayers:5000, sitecur:'EUR', geo:'de' },
  },
  {
    label: 'CIS monthly dynamic',
    params: { region:'cis', segment:'dormant',  duration:'monthly',     prizePool:5000, poolModel:'dynamic', rake:15, totalPlayers:2000, sitecur:'RUB', geo:'ru' },
  },
  {
    label: 'EU flash VIP hybrid',
    params: { region:'eu', segment:'vip',       duration:'flash',       prizePool:500,  poolModel:'hybrid',  rake:10, totalPlayers:10000,sitecur:'GBP', geo:'uk' },
  },
  {
    label: 'MN weekly new players',
    params: { region:'mn', segment:'new',       duration:'weekly',      prizePool:200000,poolModel:'fixed',  rake:0,  totalPlayers:3000, sitecur:'MNT', geo:'mn' },
  },
  {
    label: 'EU multi_round depositors',
    params: { region:'eu', segment:'depositors',duration:'multi_round', prizePool:2500, poolModel:'hybrid',  rake:5,  totalPlayers:8000, sitecur:'DKK', geo:'dk' },
  },
];

const FIELDS = ['roi', 'netMarginMid', 'ggrLiftMid', 'costPerActiveMid', 'retentionValue', 'prizePoolCost'];

describe('tournament econ client/server parity', () => {
  for (const { label, params } of CASES) {
    it(`matches for: ${label}`, () => {
      const server = serverCalc(params);
      const client = clientCalc(params);

      for (const field of FIELDS) {
        expect(client[field]).toBe(server[field],
          `field "${field}" mismatch for "${label}": client=${client[field]} server=${server[field]}`);
      }
    });
  }
});
