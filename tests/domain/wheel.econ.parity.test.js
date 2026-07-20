/**
 * Parity test: client-side wheel-econ.js must produce the same result as the
 * server-side wheel domain (buildWheel + calcWheelEconomics) for the same inputs.
 */

import { describe, it, expect } from 'vitest';
import { buildWheel as serverBuild } from '../../src/domain/wheel/buildWheel.js';
import { calcWheelEconomics as serverCalc } from '../../src/domain/wheel/calcEconomics.js';
import {
  materializeSegments as clientMaterialize,
  calcWheelEconomics as clientCalc,
} from '../../public/wheel-econ.js';

const CASES = [
  { label: 'EU welcome on_deposit', preset: 'welcome', region: 'eu',  segment: 'new',        players: 5000, avgDeposit: 100,  frequency: 'on_deposit', sitecur: 'EUR', geo: 'de' },
  { label: 'CIS daily depositors',  preset: 'daily',   region: 'cis', segment: 'depositors', players: 3000, avgDeposit: 5000, frequency: 'daily',      sitecur: 'RUB', geo: 'ru' },
  { label: 'EU vip weekly',         preset: 'vip',     region: 'eu',  segment: 'vip',        players: 8000, avgDeposit: 200,  frequency: 'weekly',     sitecur: 'GBP', geo: 'uk' },
  { label: 'MN daily new',          preset: 'daily',   region: 'mn',  segment: 'new',        players: 2000, avgDeposit: 50000,frequency: 'one_time',   sitecur: 'MNT', geo: 'mn' },
];

const FIELDS = [
  'arpu', 'eligible', 'evPerSpin', 'topPrizeCost', 'participantsMid',
  'programCostMid', 'ggrUpliftMid', 'retentionValue', 'totalValueMid',
  'netResultMid', 'costRatio', 'costPerActiveMid', 'maxRisk', 'roi', 'breakEvenParticipants',
];

describe('wheel materializeSegments client/server parity', () => {
  for (const { label, preset, avgDeposit } of CASES) {
    it(`matches for: ${label}`, () => {
      const server = serverBuild({ preset, avgDeposit }).segments;
      const client = clientMaterialize(preset, avgDeposit);
      expect(client).toEqual(server);
    });
  }
});

describe('wheel econ client/server parity', () => {
  for (const c of CASES) {
    it(`matches for: ${c.label}`, () => {
      const segments = serverBuild({ preset: c.preset, avgDeposit: c.avgDeposit }).segments;
      const params = {
        region: c.region, segment: c.segment, players: c.players, avgDeposit: c.avgDeposit,
        segments, frequency: c.frequency, sitecur: c.sitecur, geo: c.geo,
      };
      const server = serverCalc(params);
      const client = clientCalc(params);
      for (const f of FIELDS) {
        expect(client[f]).toBe(server[f],
          `field "${f}" mismatch for "${c.label}": client=${client[f]} server=${server[f]}`);
      }
    });
  }
});
