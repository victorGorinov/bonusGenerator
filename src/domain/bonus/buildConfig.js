import { truncNormalPayout } from './payout.js';
import { GEO }               from '../../config/geo/index.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function buildWelcome(geo, dep, cur, license) {
  const w = geo.welcome;

  // Sweep and MN are fully static in their geo config
  if (w.type === 'sweep') return { ...w };
  if (w.cur === 'MNT')    return { type: 'match', ...w, trigger: 'v_first_dep' };

  // Apply UKGC license overrides to welcome caps
  const overrides = geo.licenses?.[license]?.welcome ?? {};
  const maxBMin = overrides.maxBMin ?? w.maxBMin;
  const maxBMax = overrides.maxBMax ?? w.maxBMax;

  const maxB = clamp(Math.round(dep * w.maxBMulti), maxBMin, maxBMax);
  const minD = Math.max(w.minDMin, Math.round(dep * w.minDRatio));
  return {
    type: 'match', pct: w.pct, maxB, minD,
    cur: w.cur ?? cur, fs: w.fs, days: w.days, code: w.code, trigger: 'v_first_dep',
  };
}

function buildNdb(geo, dep, depcur, license) {
  const n = geo.licenses?.[license]?.ndb ?? geo.ndb;

  if (n.type === 'daily') return { ...n };
  if (n.type === 'fs_restricted') return { ...n, limit: 'v_1_per_account', trigger: 'v_reg_verify' };
  if (n.type === 'sweep_daily') return { ...n };

  // MN uses amtRatio
  const amt = n.amtRatio != null
    ? Math.min(n.amtMax, Math.round(dep * n.amtRatio))
    : n.amt ?? Math.round(dep * 0.02);

  const ndCur = n.ndCur ?? (n.type === 'crypto' ? depcur : 'FS');
  return {
    type: n.type, amt, fs: n.fs, ndCur,
    wager: n.wager, maxW_x: n.maxW_x, days: n.days,
    limit: n.limit ?? 'v_1_per_account', trigger: n.trigger ?? 'v_reg_verify',
    ...(n.note ? { note: n.note } : {}),
  };
}

function buildReload(geo, dep, cur, wMinD, license) {
  const rl = geo.reload;

  if (rl.type === 'packages') return { ...rl };
  if (rl.type === 'match' && rl.maxBRatio != null) {
    // MN
    const maxB = Math.min(rl.maxBMax, Math.round(dep * rl.maxBRatio));
    return { type: 'match', pct: 50, maxB, minD: wMinD, cur: rl.cur, fs: rl.fs, freq: 'v_weekly', day: rl.day, limit: 'v_1_per_period', code: 'RELOAD50' };
  }

  const licOverrides = geo.licenses?.[license]?.reload ?? {};
  const maxBMax = licOverrides.maxBMax ?? rl.maxBMax;
  const fs      = licOverrides.fs      ?? rl.fs;
  const maxB    = clamp(Math.round(dep * rl.maxBMulti), rl.maxBMin, maxBMax);
  return {
    type: 'match', pct: 50, maxB, minD: wMinD,
    cur: rl.cur ?? cur, fs, freq: 'v_weekly', day: rl.day, limit: 'v_1_per_period', code: 'RELOAD50',
  };
}

function buildWager(geo, rt, license) {
  const base = geo.wager;
  if (base.model === 'none') return { ...base };

  const ov = geo.licenses?.[license]?.wager ?? {};
  return {
    model: 'standard',
    wW: ov.wW ?? base.wW, wN: ov.wN ?? base.wN,
    wR: ov.wR ?? base.wR, wF: ov.wF ?? base.wF,
    mb: ov.mb ?? base.mb,
    days: base.days, basis: base.basis, games: base.games, gameRtp: rt,
  };
}

function buildCashback(geo, dep, cur) {
  const cb = geo.cashback;
  if (cb.model === 'tier') {
    return {
      model: 'tier', period: cb.period, basis: cb.basis,
      maxAmt: `5000 ${cur}`, wager: cb.wager,
      tiers: cb.tiers.map(t => ({
        name: t.name, color: t.color, pct: t.pct,
        from: `${t.fromX} ${cur}`,
        to:   t.toX != null ? `${t.toX} ${cur}` : '∞',
      })),
    };
  }
  if (cb.minLoss != null) return { ...cb }; // static (sweep, mn)
  const minL = Math.round(dep * cb.minLossRatio);
  const maxA = Math.round(dep * cb.maxAmtRatio);
  return {
    model: 'flat', pct: cb.pct, cur: cb.cur ?? cur,
    period: cb.period, basis: cb.basis,
    minLoss: `${minL} ${cb.cur ?? cur}`,
    maxAmt:  `${maxA} ${cb.cur ?? cur}`,
    wager: cb.wager,
  };
}

function buildDep2(geo, dep, cur, wMinD, wagerWW, license) {
  const d = geo.dep2;
  if (d.type === 'sc_purchase') return { ...d };
  if (d.cur === 'MNT') return { ...d, minD: wMinD, wager: wagerWW }; // MN static

  const ov = geo.licenses?.[license]?.dep2 ?? {};
  const maxBMulti = ov.maxBMulti ?? d.maxBMulti;
  const maxBMin   = ov.maxBMin   ?? d.maxBMin;
  const maxBMax   = ov.maxBMax   ?? d.maxBMax;
  const fs        = ov.fs        ?? d.fs;
  const maxB = clamp(Math.round(dep * maxBMulti), maxBMin, maxBMax);
  return { type: 'match', pct: d.pct, maxB, minD: wMinD, cur: d.cur ?? cur, fs, days: d.days ?? 30, wager: wagerWW, code: 'DEP2', trigger: 'v_2nd_purchase' };
}

function buildDep3(geo, dep, cur, wMinD, wagerWW, license) {
  const d = geo.dep3;
  if (d.type === 'sc_purchase') return { ...d };
  if (d.cur === 'MNT') return { ...d, minD: wMinD }; // MN static

  const ov = geo.licenses?.[license]?.dep3 ?? {};
  const maxBMulti = ov.maxBMulti ?? d.maxBMulti;
  const maxBMin   = ov.maxBMin   ?? d.maxBMin;
  const maxBMax   = ov.maxBMax   ?? d.maxBMax;
  const fs        = ov.fs        ?? d.fs;
  const wagerOffset = d.wagerOffset ?? 0;
  const maxB = clamp(Math.round(dep * maxBMulti), maxBMin, maxBMax);
  return { type: 'match', pct: d.pct, maxB, minD: wMinD, cur: d.cur ?? cur, fs, days: d.days ?? 30, wager: Math.max(25, wagerWW + wagerOffset), code: 'DEP3', trigger: 'v_3rd_purchase' };
}

export function buildConfig(params) {
  const { region, players, sitecur, depcur, avgdep, plat, lic, rtp, riskAdj } = params;
  const dep     = Number(avgdep)   || 100;
  const pl      = Number(players)  || 5000;
  const r       = region;
  const cur     = sitecur;
  const sc      = sitecur;
  const license = lic || 'mga';
  const rt      = Number(rtp)      || 96;

  const geo = GEO[r];

  const welcome  = buildWelcome(geo, dep, cur, license);
  const ndb      = buildNdb(geo, dep, depcur, license);
  const wager    = buildWager(geo, rt, license);

  if (riskAdj && wager.model !== 'none') {
    wager.wW = Math.max(5, wager.wW + riskAdj);
    wager.wN = Math.max(5, wager.wN + riskAdj);
    wager.wR = Math.max(5, wager.wR + Math.round(riskAdj * 0.7));
    wager.wF = Math.max(5, wager.wF + Math.round(riskAdj * 0.7));
  }

  const reload   = buildReload(geo, dep, cur, welcome.minD, license);
  const cashback = buildCashback(geo, dep, cur);
  const dep2     = buildDep2(geo, dep, cur, welcome.minD, wager.wW, license);
  const dep3     = buildDep3(geo, dep, cur, welcome.minD, wager.wW, license);
  const contrib  = geo.contrib;
  const fsSpec   = geo.fsSpec ? { ...geo.fsSpec, wager: wager.wF, games: 'v_slots_only', maxW: '5x_spin_value' } : null;
  const reg      = geo.licenses?.[license]?.reg ?? geo.reg;

  // Econ
  const { arpu, bpct, cac } = geo;
  const ltv3    = arpu * 3;
  const mBudget = Math.round(pl * cac);
  const totLTV  = Math.round(pl * ltv3);
  const roi3    = Math.round((totLTV - mBudget * 3) / (mBudget * 3) * 100);
  const be      = Math.ceil(cac / arpu);

  const mix  = geo.mix;
  const wcrs = geo.wcrs;
  const rtps = [rt / 100, 0.99, 0.98, 0.97];

  const mixedWCR  = mix.reduce((s, sh, i) => s + sh * wcrs[i], 0);
  const mixedRTP  = mix.reduce((s, sh, i) => s + sh * rtps[i], 0);
  const bonusSize = r === 'sweep' ? (welcome.sc || 50) : Math.min(dep * (welcome.pct || 100) / 100, welcome.maxB || dep);
  const wagerX    = (r === 'sweep' || wager.model === 'none') ? 0 : wager.wW;
  const breakeven_wager = +(mixedWCR / (1 - mixedRTP)).toFixed(1);
  const over_breakeven  = wagerX > breakeven_wager;

  const calcScenario = (conv, dWCR, dRTP) => {
    const adjWCR = Math.max(0.01, mixedWCR + dWCR);
    const adjRTP = Math.min(0.999, Math.max(0.5, mixedRTP + dRTP));
    const payout = truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP);
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
  const _effN = (wager.wN || 50) > 0 ? Math.min(1, _be / Math.max(_be, wager.wN || 50)) : 1;
  const _effR = (wager.wR || 30) > 0 ? Math.min(1, _be / Math.max(_be, wager.wR || 30)) : 1;
  const _ndbSize = !ndb || ndb.type === 'daily' ? 0 : ndb.type === 'combined' ? (ndb.amt || 0) + (ndb.fs || 0) * _sv : ndb.type === 'fs_restricted' ? (ndb.fs || 0) * _sv : (ndb.amt || 0);
  const _rlBase  = reload && reload.pct ? Math.min(dep * (reload.pct / 100), reload.maxB || dep) + (reload.fs || 0) * _sv : 0;
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
