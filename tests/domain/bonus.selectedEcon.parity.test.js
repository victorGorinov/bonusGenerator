// Parity: public/bonus-selected-econ.js must match src/domain/bonus/selectedEcon.ts
import { describe, it, expect } from 'vitest';
import { buildConfig }              from '../../src/domain/bonus/buildConfig.js';
import { computeSelectedEcon }      from '../../src/domain/bonus/selectedEcon.js';
import { computeSelectedEcon as computeSelectedEconLocal } from '../../public/bonus-selected-econ.js';

const CONFIGS = [
  { region: 'eu',  sitecur: 'EUR', depcur: 'EUR', players: 5000, avgdep: 100,   plat: 'both',   rtp: 96, lic: 'mga'  },
  { region: 'eu',  sitecur: 'GBP', depcur: 'GBP', players: 2000, avgdep: 80,    plat: 'both',   rtp: 96, lic: 'ukgc' },
  { region: 'cis', sitecur: 'RUB', depcur: 'RUB', players: 3000, avgdep: 5000,  plat: 'mobile', rtp: 95, lic: 'none' },
  { region: 'mn',  sitecur: 'MNT', depcur: 'MNT', players: 500,  avgdep: 50000, plat: 'mobile', rtp: 96, lic: 'none' },
];

const SELECTIONS = [
  ['welcome'],
  ['welcome', 'dep2', 'dep3'],
  ['welcome', 'reload', 'cashback'],
  ['ndb', 'reload'],
  [],
];

describe('bonus-selected-econ.js parity with server computeSelectedEcon', () => {
  CONFIGS.forEach((params) => {
    const cfg = buildConfig(params);
    SELECTIONS.forEach((sel) => {
      it(`${params.sitecur} · [${sel.join(',') || '∅'}]`, () => {
        const s = computeSelectedEcon(cfg, sel);
        const c = computeSelectedEconLocal(cfg, sel);
        expect(c.sP10.cost).toBe(s.sP10.cost);
        expect(c.sP50.cost).toBe(s.sP50.cost);
        expect(c.sP90.cost).toBe(s.sP90.cost);
        expect(c.costRatio).toBe(s.costRatio);
        expect(c.maxRisk).toBe(s.maxRisk);
        expect(c.selectedTypes).toEqual(s.selectedTypes);
      });
    });
  });
});
