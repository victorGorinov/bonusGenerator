import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// geo-data.js is a browser IIFE that attaches to `window`. Load it into a fake
// window so we can unit-test the pure currency helpers in node.
const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, '../../public/geo-data.js'), 'utf8');

let GeoData;
beforeAll(() => {
  const fakeWindow = {};
  // eslint-disable-next-line no-new-func
  new Function('window', src)(fakeWindow);
  GeoData = fakeWindow.GeoData;
});

describe('geo-data — list integrity', () => {
  it('has all 6 LatAm countries', () => {
    const latam = GeoData.all.filter(g => g.region === 'latam').map(g => g.val).sort();
    expect(latam).toEqual(['ar', 'br', 'cl', 'co', 'mx', 'pe']);
  });
  it('LatAm backend currency is USD, display is local', () => {
    const br = GeoData.of('br');
    expect(br.cur).toBe('USD');
    expect(br.local).toBe('BRL');
    expect(br.lic).toBe('bets_br');
  });
  it('non-LatAm backend currency equals display currency', () => {
    const de = GeoData.of('de');
    expect(de.cur).toBe('EUR');
    expect(de.local).toBe('EUR');
  });
  it('has all 3 MENA countries + the UAE in the GCC', () => {
    const mena = GeoData.all.filter(g => g.region === 'mena').map(g => g.val).sort();
    expect(mena).toEqual(['iq', 'ly', 'sy']);
    expect(GeoData.all.filter(g => g.region === 'gcc').map(g => g.val)).toEqual(['ae']);
  });
  it('MENA/GCC use the LatAm model: USD backend, local display currency', () => {
    for (const [val, local] of [['iq', 'IQD'], ['ly', 'LYD'], ['sy', 'SYP'], ['ae', 'AED']]) {
      const g = GeoData.of(val);
      expect(g.cur, val).toBe('USD');
      expect(g.local, val).toBe(local);
      // No local licensing path exists in any of these markets.
      expect(g.lic, val).toBe('none');
      // A display rate must exist, else curFactor silently collapses to 1.
      expect(g.localRate, val).toBeGreaterThan(0);
    }
  });
  it('every geo resolves a rate for both its backend and display currency', () => {
    for (const g of GeoData.all) {
      expect(GeoData.rates[g.cur], `${g.val}/${g.cur}`).toBeGreaterThan(0);
      expect(GeoData.rates[g.local], `${g.val}/${g.local}`).toBeGreaterThan(0);
    }
  });
  it('every region in the list has a label in both locales', () => {
    for (const g of GeoData.all) {
      expect(GeoData.regionLabels[g.region], g.region).toBeTruthy();
      expect(GeoData.regionLabels[g.region].en, g.region).toBeTruthy();
      expect(GeoData.regionLabels[g.region].ru, g.region).toBeTruthy();
    }
  });
});

describe('geo-data — MENA/GCC currency factor', () => {
  it('AED is pegged: USD → AED ×3.6725', () => {
    const ae = GeoData.of('ae');
    expect(GeoData.curFactor(ae, 'local')).toBeCloseTo(3.6725);
    expect(GeoData.dispCur(ae, 'local')).toBe('AED');
    expect(GeoData.curFactor(ae, 'usd')).toBe(1);
  });
  it('SYP high-denomination display does not distort the USD backend value', () => {
    const sy = GeoData.of('sy');
    expect(GeoData.curFactor(sy, 'local')).toBeCloseTo(13000);
    // Round-trip: a value typed in the display currency converts back to the USD base.
    expect(GeoData.avgdepToBase(GeoData.avgdepToDisp(sy, 'local'), sy, 'local'))
      .toBeCloseTo(sy.avgdep);
  });
});

describe('geo-data — currency factor', () => {
  it('LatAm defaults to local currency (USD → BRL ×5.5)', () => {
    const br = GeoData.of('br');
    expect(GeoData.curFactor(br, 'local')).toBeCloseTo(5.5);
    expect(GeoData.dispCur(br, 'local')).toBe('BRL');
  });
  it('LatAm USD toggle → factor 1', () => {
    const br = GeoData.of('br');
    expect(GeoData.curFactor(br, 'usd')).toBe(1);
    expect(GeoData.dispCur(br, 'usd')).toBe('USD');
  });
  it('non-LatAm local mode is a no-op (native currency)', () => {
    const ru = GeoData.of('ru');
    expect(GeoData.curFactor(ru, 'local')).toBe(1);
  });
  it('non-LatAm USD toggle converts native→USD (RUB ÷90)', () => {
    const ru = GeoData.of('ru');
    expect(GeoData.curFactor(ru, 'usd')).toBeCloseTo(1 / 90);
  });
});

describe('geo-data — convertConfigCurrency', () => {
  const cfg = {
    cur: 'USD', dep: 100,
    welcome: { maxB: 500, minD: 10, cur: 'USD' },
    ndb:     { amt: 5, ndCur: 'USD' },
    cashback:{ minLoss: '33 USD', maxAmt: '1700 USD', cur: 'USD' },
    fsSpec:  { val: 0.1, cur: 'USD' },
    econ: {
      arpu: 18, cac: 7, ltv3: 54, mBudget: 35000,
      bonusSize: 100, maxRisk: 500000, costRatio: 0.2, roi3: 160,
      sP50: { cost: 20000, payout: 40, turnover: 1000 },
      chain: { chainCost: 30000, chainMaxRisk: 700000, steps: [{ bonusSize: 100, cost: 20000 }] },
    },
  };

  it('factor 1 returns the input unchanged (identity)', () => {
    expect(GeoData.convertConfigCurrency(cfg, 1, 'BRL')).toBe(cfg);
  });

  it('converts sitecur fields, relabels currency, leaves USD benchmarks', () => {
    const out = GeoData.convertConfigCurrency(cfg, 5.5, 'BRL');
    // sitecur amounts scaled + relabeled
    expect(out.dep).toBe(550);
    expect(out.cur).toBe('BRL');
    expect(out.welcome.maxB).toBe(2750);
    expect(out.welcome.cur).toBe('BRL');
    expect(out.ndb.amt).toBe(28); // round(5*5.5)
    expect(out.cashback.minLoss).toBe('182 BRL'); // round(33*5.5)
    expect(out.econ.bonusSize).toBe(550);
    expect(out.econ.maxRisk).toBe(2750000);
    expect(out.econ.sP50.cost).toBe(110000);
    expect(out.econ.chain.chainCost).toBe(165000);
    // USD benchmarks untouched
    expect(out.econ.arpu).toBe(18);
    expect(out.econ.cac).toBe(7);
    expect(out.econ.mBudget).toBe(35000);
    // ratios untouched
    expect(out.econ.costRatio).toBe(0.2);
    expect(out.econ.roi3).toBe(160);
  });

  it('does not mutate the input object', () => {
    GeoData.convertConfigCurrency(cfg, 5.5, 'BRL');
    expect(cfg.dep).toBe(100);
    expect(cfg.welcome.maxB).toBe(500);
  });

  it('leaves FS-denominated NDB amount alone', () => {
    const fsCfg = { cur: 'USD', ndb: { amt: 50, ndCur: 'FS' } };
    const out = GeoData.convertConfigCurrency(fsCfg, 5.5, 'BRL');
    expect(out.ndb.amt).toBe(50);
    expect(out.ndb.ndCur).toBe('FS');
  });
});

describe('geo-data — scaleFields', () => {
  const econ = { ggrLiftMid: 1000, netMarginMid: 500, participantsMid: 42, roi: 120, prizePoolCost: 200 };

  it('scales only the listed money keys, leaves the rest', () => {
    const out = GeoData.scaleFields(econ, 5.5, ['ggrLiftMid', 'netMarginMid', 'prizePoolCost']);
    expect(out.ggrLiftMid).toBe(5500);
    expect(out.netMarginMid).toBe(2750);
    expect(out.prizePoolCost).toBe(1100);
    expect(out.participantsMid).toBe(42); // count — untouched
    expect(out.roi).toBe(120);            // % — untouched
  });

  it('factor 1 is identity (no clone)', () => {
    expect(GeoData.scaleFields(econ, 1, ['ggrLiftMid'])).toBe(econ);
  });

  it('does not mutate the input and ignores missing keys', () => {
    const out = GeoData.scaleFields(econ, 2, ['ggrLiftMid', 'nonexistent']);
    expect(econ.ggrLiftMid).toBe(1000);
    expect(out.ggrLiftMid).toBe(2000);
    expect('nonexistent' in out).toBe(false);
  });
});

describe('geo-data — convertCosts', () => {
  it('scales all cost fields + maxRisk', () => {
    const data = { costs: { w_p50: 20000, total: 25000, ndb: 0 }, maxRisk: 500000 };
    const out = GeoData.convertCosts(data, 5.5);
    expect(out.costs.w_p50).toBe(110000);
    expect(out.costs.total).toBe(137500);
    expect(out.maxRisk).toBe(2750000);
  });
  it('factor 1 is identity', () => {
    const data = { costs: { total: 100 }, maxRisk: 5 };
    expect(GeoData.convertCosts(data, 1)).toBe(data);
  });
});
