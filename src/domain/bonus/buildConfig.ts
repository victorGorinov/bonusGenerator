import { truncNormalPayout }          from './payout.js';
import { GEO }                        from '../../config/geo/index.js';
import { GLOBAL_LICENSE_OVERRIDES }   from '../../config/geo/global-licenses.js';

type GeoValue = (typeof GEO)[keyof typeof GEO];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function buildWelcome(geo: GeoValue, dep: number, cur: string, license: string): Record<string, unknown> {
  const w = geo.welcome as Record<string, unknown>;

  if (w['type'] === 'sweep') return { ...w };
  if (w['cur'] === 'MNT')    return { type: 'match', ...w, trigger: 'v_first_dep' };

  const licCfg = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const overrides = (licCfg?.[license]?.['welcome'] ?? {}) as Record<string, number>;
  const maxBMin = overrides['maxBMin'] ?? (w['maxBMin'] as number);
  const maxBMax = overrides['maxBMax'] ?? (w['maxBMax'] as number);

  const maxB = clamp(Math.round(dep * (w['maxBMulti'] as number)), maxBMin, maxBMax);
  const minD = Math.max(w['minDMin'] as number, Math.round(dep * (w['minDRatio'] as number)));
  return {
    type: 'match', pct: w['pct'], maxB, minD,
    cur: w['cur'] ?? cur, fs: w['fs'], days: w['days'], code: w['code'], trigger: 'v_first_dep',
  };
}

function buildNdb(geo: GeoValue, dep: number, depcur: string, license: string): Record<string, unknown> {
  const licCfg = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const n = (licCfg?.[license]?.['ndb'] ?? geo.ndb) as Record<string, unknown>;

  if (n['type'] === 'daily') return { ...n };
  if (n['type'] === 'fs_restricted') return { ...n, limit: 'v_1_per_account', trigger: 'v_reg_verify' };

  const amt = n['amtRatio'] != null
    ? Math.min(n['amtMax'] as number, Math.round(dep * (n['amtRatio'] as number)))
    : n['amt'] != null ? n['amt'] as number : Math.round(dep * 0.02);

  const ndCur = n['ndCur'] ?? (n['type'] === 'crypto' ? depcur : 'FS');
  return {
    type: n['type'], amt, fs: n['fs'], ndCur,
    wager: n['wager'], maxW_x: n['maxW_x'], days: n['days'],
    limit: n['limit'] ?? 'v_1_per_account', trigger: n['trigger'] ?? 'v_reg_verify',
    ...(n['note'] ? { note: n['note'] } : {}),
  };
}

function buildReload(geo: GeoValue, dep: number, cur: string, wMinD: number, license: string): Record<string, unknown> {
  const rl = geo.reload as Record<string, unknown>;

  if (rl['type'] === 'packages') return { ...rl };
  if (rl['type'] === 'match' && rl['maxBRatio'] != null) {
    const maxB = Math.min(rl['maxBMax'] as number, Math.round(dep * (rl['maxBRatio'] as number)));
    return { type: 'match', pct: 50, maxB, minD: wMinD, cur: rl['cur'], fs: rl['fs'], freq: 'v_weekly', day: rl['day'], limit: 'v_1_per_period', code: 'RELOAD50' };
  }

  const licCfg = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const licOverrides = (licCfg?.[license]?.['reload'] ?? {}) as Record<string, number>;
  const maxBMax = licOverrides['maxBMax'] ?? (rl['maxBMax'] as number);
  const fs      = licOverrides['fs']      ?? (rl['fs'] as number);
  const maxB    = clamp(Math.round(dep * (rl['maxBMulti'] as number)), rl['maxBMin'] as number, maxBMax);
  return {
    type: 'match', pct: 50, maxB, minD: wMinD,
    cur: rl['cur'] ?? cur, fs, freq: 'v_weekly', day: rl['day'], limit: 'v_1_per_period', code: 'RELOAD50',
  };
}

function buildWager(geo: GeoValue, rt: number, license: string): Record<string, unknown> {
  const base = geo.wager as Record<string, unknown>;
  if (base['model'] === 'none') return { ...base };

  const licCfg  = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const ov      = (licCfg?.[license]?.['wager'] ?? {}) as Record<string, unknown>;
  const globalOv = (GLOBAL_LICENSE_OVERRIDES[license]?.wager ?? {}) as Record<string, unknown>;
  return {
    model: 'standard',
    wW: ov['wW'] ?? globalOv['wW'] ?? base['wW'],
    wN: ov['wN'] ?? globalOv['wN'] ?? base['wN'],
    wR: ov['wR'] ?? globalOv['wR'] ?? base['wR'],
    wF: ov['wF'] ?? globalOv['wF'] ?? base['wF'],
    mb: ov['mb'] ?? globalOv['mb'] ?? base['mb'],
    days: base['days'], basis: base['basis'], games: base['games'], gameRtp: rt,
  };
}

function buildCashback(geo: GeoValue, dep: number, cur: string): Record<string, unknown> {
  const cb = geo.cashback as Record<string, unknown>;
  if (cb['model'] === 'tier') {
    return {
      model: 'tier', period: cb['period'], basis: cb['basis'],
      maxAmt: `5000 ${cur}`, wager: cb['wager'],
      tiers: (cb['tiers'] as Array<Record<string, unknown>>).map(t => ({
        name: t['name'], color: t['color'], pct: t['pct'],
        from: `${t['fromX']} ${cur}`,
        to:   t['toX'] != null ? `${t['toX']} ${cur}` : '∞',
      })),
    };
  }
  if (cb['minLoss'] != null) return { ...cb };
  const minL = Math.round(dep * (cb['minLossRatio'] as number));
  const maxA = Math.round(dep * (cb['maxAmtRatio'] as number));
  return {
    model: 'flat', pct: cb['pct'], cur: cb['cur'] ?? cur,
    period: cb['period'], basis: cb['basis'],
    minLoss: `${minL} ${cb['cur'] ?? cur}`,
    maxAmt:  `${maxA} ${cb['cur'] ?? cur}`,
    wager: cb['wager'],
  };
}

function buildDep2(geo: GeoValue, dep: number, cur: string, wMinD: number, wagerWW: number, license: string): Record<string, unknown> {
  const d = geo.dep2 as Record<string, unknown>;
  if (d['type'] === 'sc_purchase') return { ...d };
  if (d['cur'] === 'MNT') return { ...d, minD: wMinD, wager: wagerWW };

  const licCfg = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const ov = (licCfg?.[license]?.['dep2'] ?? {}) as Record<string, number>;
  const maxBMulti = ov['maxBMulti'] ?? (d['maxBMulti'] as number);
  const maxBMin   = ov['maxBMin']   ?? (d['maxBMin'] as number);
  const maxBMax   = ov['maxBMax']   ?? (d['maxBMax'] as number);
  const fs        = ov['fs']        ?? (d['fs'] as number);
  const maxB = clamp(Math.round(dep * maxBMulti), maxBMin, maxBMax);
  return { type: 'match', pct: d['pct'], maxB, minD: wMinD, cur: d['cur'] ?? cur, fs, days: d['days'] ?? 30, wager: wagerWW, code: 'DEP2', trigger: 'v_2nd_purchase' };
}

function buildDep3(geo: GeoValue, dep: number, cur: string, wMinD: number, wagerWW: number, license: string): Record<string, unknown> {
  const d = geo.dep3 as Record<string, unknown>;
  if (d['type'] === 'sc_purchase') return { ...d };
  if (d['cur'] === 'MNT') return { ...d, minD: wMinD };

  const licCfg = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const ov = (licCfg?.[license]?.['dep3'] ?? {}) as Record<string, number>;
  const maxBMulti = ov['maxBMulti'] ?? (d['maxBMulti'] as number);
  const maxBMin   = ov['maxBMin']   ?? (d['maxBMin'] as number);
  const maxBMax   = ov['maxBMax']   ?? (d['maxBMax'] as number);
  const fs        = ov['fs']        ?? (d['fs'] as number);
  const wagerOffset = (d['wagerOffset'] as number) ?? 0;
  const maxB = clamp(Math.round(dep * maxBMulti), maxBMin, maxBMax);
  return { type: 'match', pct: d['pct'], maxB, minD: wMinD, cur: d['cur'] ?? cur, fs, days: d['days'] ?? 30, wager: Math.max(25, wagerWW + wagerOffset), code: 'DEP3', trigger: 'v_3rd_purchase' };
}

export interface BuildConfigParams {
  region: string;
  players?: number | string;
  sitecur: string;
  depcur: string;
  avgdep?: number | string;
  plat?: string;
  lic?: string;
  rtp?: number | string;
  riskAdj?: number;
  [key: string]: unknown;
}

export function buildConfig(params: BuildConfigParams): Record<string, unknown> {
  const { region, players, sitecur, depcur, avgdep, lic, rtp, riskAdj } = params;
  const dep     = Number(avgdep)  || 100;
  const pl      = Number(players) || 5000;
  const r       = region;
  const cur     = sitecur;
  const sc      = sitecur;
  const GEO_DEFAULT_LICENSE: Record<string, string> = {
    eu: 'mga', cis: 'none', crypto: 'none', sweep: 'none', mn: 'none', latam: 'none',
  };
  const license = lic || GEO_DEFAULT_LICENSE[r] || 'mga';
  const rt      = Number(rtp)     || 96;

  const geo = GEO[r as keyof typeof GEO];

  const welcome  = buildWelcome(geo, dep, cur, license);
  const ndb      = buildNdb(geo, dep, depcur, license);
  const wager    = buildWager(geo, rt, license);

  if (riskAdj && wager['model'] !== 'none') {
    wager['wW'] = Math.max(5, (wager['wW'] as number) + riskAdj);
    wager['wN'] = Math.max(5, (wager['wN'] as number) + riskAdj);
    wager['wR'] = Math.max(5, (wager['wR'] as number) + Math.round(riskAdj * 0.7));
    wager['wF'] = Math.max(5, (wager['wF'] as number) + Math.round(riskAdj * 0.7));
  }

  const reload   = buildReload(geo, dep, cur, welcome['minD'] as number, license);
  const cashback = buildCashback(geo, dep, cur);
  const dep2     = buildDep2(geo, dep, cur, welcome['minD'] as number, wager['wW'] as number, license);
  const dep3     = buildDep3(geo, dep, cur, welcome['minD'] as number, wager['wW'] as number, license);
  const contrib  = geo.contrib;
  const geoFsSpec = geo.fsSpec as Record<string, unknown> | null;
  const fsSpec   = geoFsSpec ? { ...geoFsSpec, wager: wager['wF'], games: 'v_slots_only', maxW: '5x_spin_value' } : null;
  const licCfg   = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>> | undefined;
  const reg      = licCfg?.[license]?.['reg'] ?? GLOBAL_LICENSE_OVERRIDES[license]?.reg ?? geo.reg;

  const { arpu, bpct, cac } = geo;
  const ltv3    = arpu * 3;
  const mBudget = Math.round(pl * cac);
  const totLTV  = Math.round(pl * ltv3);
  const roi3    = Math.round((totLTV - mBudget * 3) / (mBudget * 3) * 100);
  const be      = Math.ceil(cac / arpu);

  const mix  = geo.mix  as [number, number, number, number];
  const wcrs = geo.wcrs as [number, number, number, number];
  const rtps: [number, number, number, number] = [rt / 100, 0.99, 0.98, 0.97];

  const mixedWCR  = mix.reduce((s, sh, i) => s + sh * wcrs[i], 0);
  const mixedRTP  = mix.reduce((s, sh, i) => s + sh * rtps[i], 0);
  const wPct      = (welcome['pct'] as number) || 100;
  const wMaxB     = (welcome['maxB'] as number) || dep;
  const wSc       = (welcome['sc'] as number)  || 50;
  const bonusSize = r === 'sweep' ? wSc : Math.min(dep * wPct / 100, wMaxB);
  const wagerX    = (r === 'sweep' || wager['model'] === 'none') ? 0 : wager['wW'] as number;
  const breakeven_wager = +(mixedWCR / (1 - mixedRTP)).toFixed(1);
  const over_breakeven  = wagerX > breakeven_wager;

  const calcScenario = (conv: number, dWCR: number, dRTP: number) => {
    const adjWCR = Math.max(0.01, mixedWCR + dWCR);
    const adjRTP = Math.min(0.999, Math.max(0.5, mixedRTP + dRTP));
    const payoutStat = truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP);
    // For large-denomination currencies (RUB, KZT, MNT) z = mu/sigma falls in the range
    // -20 to -39 where _Phi(z) underflows to exactly 0 while _phi(z) remains representable,
    // leaving a spurious tiny positive payoutStat (e.g. 1.8e-200). The check payoutStat > 0
    // would be true but cost rounds to 0. Use a relative threshold: payoutStat < 1 ppm of
    // bonusSize is a numerical artifact — fall back to the deterministic breakeven estimate.
    const adjBe  = adjWCR / (1 - adjRTP);
    const adjEff = wagerX > 0 ? Math.min(1, adjBe / Math.max(adjBe, wagerX)) : 1;
    const payout = payoutStat > bonusSize * 1e-6 ? payoutStat : bonusSize * adjEff;
    const cost   = Math.round(payout * conv * pl);
    return { conv, wcr: +adjWCR.toFixed(3), rtp: +adjRTP.toFixed(3), turnover: Math.round(bonusSize * wagerX / adjWCR), payout: +payout.toFixed(2), cost };
  };

  const sP10     = calcScenario(0.10, -0.02, -0.005);
  const sP50     = calcScenario(0.20,  0.00,  0.000);
  const sP90     = calcScenario(0.40, +0.02, +0.003);
  const maxRisk  = Math.round(pl * bonusSize);
  const stressTest = Math.round(sP50.cost * 1.20);

  const _sv   = 0.10;
  const _be   = breakeven_wager;
  const _effW = wagerX > 0 ? Math.min(1, _be / Math.max(_be, wagerX)) : 1;
  const wN    = (wager['wN'] as number) || 50;
  const _effN = wN > 0 ? Math.min(1, _be / Math.max(_be, wN)) : 1;
  const wR    = (wager['wR'] as number) || 30;
  const _effR = wR > 0 ? Math.min(1, _be / Math.max(_be, wR)) : 1;

  const ndbType = ndb['type'] as string;
  const ndbAmt  = (ndb['amt'] as number) || 0;
  const ndbFs   = (ndb['fs']  as number) || 0;
  const _ndbSize = ndbType === 'daily' ? 0
    : ndbType === 'combined'     ? ndbAmt + ndbFs * _sv
    : ndbType === 'fs_restricted'? ndbFs * _sv
    : ndbAmt;

  const rlPct  = (reload['pct']  as number) || 0;
  const rlMaxB = (reload['maxB'] as number) || 0;
  const rlFs   = (reload['fs']   as number) || 0;
  const _rlBase  = rlPct ? Math.min(dep * (rlPct / 100), rlMaxB || dep) + rlFs * _sv : 0;
  const totalBonusCost = ((bonusSize * _effW * sP50.conv) + (_ndbSize * _effN * 0.40) + (_rlBase * _effR * 0.05 * 2)) * pl;
  const costRatio = pl * dep > 0 ? totalBonusCost / (pl * dep) : 0;

  let verdictKey = 'verdict_warn';
  if      (costRatio < 0.10) verdictKey = 'verdict_cheap';
  else if (costRatio < 0.25) verdictKey = 'verdict_ok';
  else if (costRatio < 0.40) verdictKey = 'verdict_warn';
  else                       verdictKey = 'verdict_high';

  return {
    r, cur, depcur, dep, pl, lic: license, rtp: rt, sc,
    welcome, dep2, dep3, ndb, reload, wager, cashback, contrib, fsSpec,
    econ: {
      arpu, bpct: +(bpct * 100).toFixed(0), cac, ltv3, mBudget, totLTV, roi3, be, pl,
      bonusSize, mixedWCR: +mixedWCR.toFixed(3), mixedRTP: +mixedRTP.toFixed(4),
      breakeven_wager, over_breakeven, wagerX, sP10, sP50, sP90,
      maxRisk, stressTest, costRatio: +costRatio.toFixed(3), verdictKey,
    },
    reg,
  };
}
