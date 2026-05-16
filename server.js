import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: '64kb' }));
app.get('/generator.html', (_req, res) => res.redirect(301, '/campaign-generator.html'));
app.use(express.static(path.join(__dirname, 'public')));

const apiLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });
const signupLimiter = rateLimit({ windowMs: 60 * 60_000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, try again later' } });
app.use('/api/generate', apiLimiter);
app.use('/api/recalc', apiLimiter);
app.use('/api/signup', signupLimiter);

function _erf(x){
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
function _phi(z){
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}
function _Phi(z){
  return 0.5 * (1 + _erf(z / Math.SQRT2));
}
function truncNormalPayout(B, W, adjWCR, adjRTP){
  if (B <= 0 || W <= 0) return 0;
  const be = adjWCR / (1 - adjRTP);
  const mu = B * (1 - W / be);
  const sigma = Math.sqrt(W * B / adjWCR);
  const z = mu / sigma;
  return Math.max(0, mu * _Phi(z) + sigma * _phi(z));
}

function buildConfig(params){
  const { region, players, sitecur, depcur, avgdep, plat, lic, rtp, riskAdj } = params;
  const dep = Number(avgdep) || 100;
  const pl = Number(players) || 5000;
  const r = region;
  const cur = sitecur;
  const sc = sitecur;
  const license = lic || 'mga';
  const rt = Number(rtp) || 96;

  const welcome = (() => {
    if (r === 'sweep') {
      return { type:'sweep', sc:10, gc:1000, trigger:'v_sweep_trigger', validity:30, wager:0, cur:'USD', code:'SWEEP10' };
    }
    if (r === 'mn') {
      return { type:'match', pct:100, maxB:100000, minD:3000, cur:'MNT', fs:30, days:30, code:'WELCOME100', trigger:'v_first_dep' };
    }
    if (r === 'latam') {
      const maxB = Math.max(300, Math.min(500, Math.round(dep * 8)));
      const minD = Math.max(10, Math.round(dep * 0.25));
      return { type:'match', pct:100, maxB, minD, cur:'USD', fs:100, days:30, code:'WELCOME100', trigger:'v_first_dep' };
    }
    const multi = r === 'cis' ? 5 : r === 'eu' ? 6 : 4;
    const maxB = r === 'eu' && license === 'ukgc'
      ? Math.max(100, Math.min(200, Math.round(dep * multi)))
      : r === 'eu'
      ? Math.max(1000, Math.min(5000, Math.round(dep * multi)))
      : r === 'crypto'
      ? Math.max(1000, Math.min(5000, Math.round(dep * 15)))
      : Math.round(dep * multi);
    const minD = r === 'cis'
      ? Math.round(dep * 0.3)
      : r === 'eu'
      ? Math.max(10, Math.round(dep * 0.15))
      : r === 'crypto'
      ? Math.max(10, Math.round(dep * 0.05))
      : Math.round(dep * 0.05);
    const fs = r === 'cis' ? 100 : r === 'eu' ? 200 : 200;
    const days = r === 'crypto' ? 90 : 30;
    const finalPct = r === 'crypto' ? 150 : 100;
    return { type:'match', pct:finalPct, maxB, minD, cur, fs, days, code: r === 'crypto' ? 'WELCOME150' : 'WELCOME100', trigger:'v_first_dep' };
  })();

  const ndb = (() => {
    if (r === 'sweep') {
      return { type:'daily', sc:1, gc:100, trigger:'v_daily_trigger', days:1, limit:'v_1_per_period', wager:0 };
    }
    if (r === 'eu' && license === 'ukgc') {
      return { type:'fs_restricted', fs:20, maxW_x:3, wager:10, days:7, note:'ukgc_note', trigger:'v_reg_verify', limit:'v_1_per_account' };
    }
    if (r === 'mn') {
      const ndAmt = Math.min(5000, Math.round(dep * 0.25));
      return { type:'combined', amt:ndAmt, fs:20, ndCur:'MNT', wager:35, maxW_x:3, days:7, limit:'v_1_per_account', trigger:'v_reg_verify' };
    }
    if (r === 'latam') {
      return { type:'combined', amt:5, fs:15, ndCur:'USD', wager:45, maxW_x:5, days:7, limit:'v_1_per_account', trigger:'v_reg_verify' };
    }
    const amt = r === 'cis' ? 30 : r === 'eu' ? 10 : dep * 0.02;
    const ndCur = r === 'crypto' ? depcur : 'FS';
    const wag = r === 'cis' ? 55 : r === 'eu' ? 45 : 50;
    const maxW = r === 'cis' ? 5 : r === 'eu' ? 3 : 3;
    const ndb_fs = r === 'crypto' ? 50 : 50;
    const type = r === 'crypto' ? 'crypto' : 'combined';
    return { type, amt, fs:ndb_fs, ndCur, wager:wag, maxW_x:maxW, days:r === 'crypto' ? 14 : 7, limit:'v_1_per_account', trigger:'v_reg_verify' };
  })();

  const reload = (() => {
    if (r === 'sweep') {
      return { type:'packages', pkgs:[{price:'$4.99',sc:100},{price:'$9.99',sc:250},{price:'$19.99',sc:500},{price:'$49.99',sc:1500}] };
    }
    if (r === 'mn') {
      const maxB = Math.min(10000, Math.round(dep * 0.75));
      return { type:'match', pct:50, maxB, minD:welcome.minD, cur:'MNT', fs:10, freq:'v_weekly', day:'v_day_sat', limit:'v_1_per_period', code:'RELOAD50' };
    }
    if (r === 'latam') {
      const maxB = Math.min(75, Math.round(dep * 2.5));
      return { type:'match', pct:50, maxB, minD:welcome.minD, cur:'USD', fs:20, freq:'v_weekly', day:'v_day_wed', limit:'v_1_per_period', code:'RELOAD50' };
    }
    const maxB = r === 'cis'
      ? Math.min(200, Math.round(dep * 1.5))
      : r === 'eu' && license === 'ukgc'
      ? Math.min(100, Math.round(dep * 1.5))
      : r === 'eu'
      ? Math.max(100, Math.min(500, Math.round(dep * 1.5)))
      : Math.min(300, Math.round(dep * 1.5));
    const minD = welcome.minD;
    const day = r === 'cis' ? 'v_day_fri' : r === 'eu' ? 'v_day_tue' : 'v_day_mon';
    const rl_fs = r === 'cis' ? 50 : r === 'eu' && license === 'ukgc' ? 0 : r === 'eu' ? 50 : r === 'crypto' ? 100 : 30;
    return { type:'match', pct:50, maxB, minD, cur, fs:rl_fs, freq:'v_weekly', day, limit:'v_1_per_period', code:'RELOAD50' };
  })();

  const wager = (() => {
    if (r === 'sweep') {
      return { model:'none', wW:0, wN:0, wR:0, wF:0, mb:'v_no_limit', days:0, basis:'v_no_wager', games:'v_no_limit' };
    }
    if (r === 'mn') {
      return { model:'standard', wW:40, wN:35, wR:30, wF:25, mb:'v_no_limit', days:30, basis:'v_bonus_only', games:'v_slots_only', gameRtp:rt };
    }
    if (r === 'latam') {
      return { model:'standard', wW:40, wN:45, wR:35, wF:30, mb:'v_no_limit', days:30, basis:'v_bonus_only', games:'v_slots_only', gameRtp:rt };
    }
    const wW = r === 'cis' ? 40 : r === 'eu' ? (license === 'ukgc' ? 10 : 35) : 40;
    const wN = r === 'cis' ? 55 : r === 'eu' ? (license === 'ukgc' ? 10 : 50) : 50;
    const wR = r === 'cis' ? 35 : r === 'eu' ? 25 : 35;
    const wF = r === 'cis' ? 35 : r === 'eu' ? (license === 'ukgc' ? 10 : 25) : 30;
    const mb = r === 'eu' && license === 'ukgc' ? 'v_ukgc_max_bet' : r === 'eu' ? 'v_eu_max_bet' : 'v_no_limit';
    const basis = r === 'crypto' ? 'v_dep_bonus' : 'v_bonus_only';
    const games = r === 'crypto' ? 'v_all_games' : 'v_slots_only';
    return { model:'standard', wW, wN, wR, wF, mb, days: r === 'crypto' ? 90 : 30, basis, games, gameRtp:rt };
  })();

  // Apply risk-level adjustment before dep2/dep3 use wager.wW and before econ is computed
  if (riskAdj && wager.model !== 'none') {
    wager.wW = Math.max(5, wager.wW + riskAdj);
    wager.wN = Math.max(5, wager.wN + riskAdj);
    wager.wR = Math.max(5, wager.wR + Math.round(riskAdj * 0.7));
    wager.wF = Math.max(5, wager.wF + Math.round(riskAdj * 0.7));
  }

  const cashback = (() => {
    if (r === 'sweep') {
      return { model:'flat', pct:5, cur:'SC', period:'v_weekly', basis:'v_net_losses', minLoss:'10 SC', maxAmt:'500 SC', wager:0 };
    }
    if (r === 'mn') {
      return { model:'flat', pct:8, cur:'MNT', period:'v_weekly', basis:'v_net_losses', minLoss:'3000 MNT', maxAmt:'200000 MNT', wager:0 };
    }
    if (r === 'latam') {
      const minL = Math.max(10, Math.round(dep * 0.33));
      const maxA = Math.min(500, Math.round(dep * 17));
      return { model:'flat', pct:10, cur:'USD', period:'v_weekly', basis:'v_net_losses', minLoss:`${minL} USD`, maxAmt:`${maxA} USD`, wager:0 };
    }
    if (r === 'eu') {
      return { model:'tier', period:'v_monthly', basis:'v_net_losses_monthly', maxAmt:'5000 '+cur, wager:0, tiers:[
        {name:'ct_bronze', color:'#CD7F32', from:'0 '+cur, to:'100 '+cur, pct:'5%'},
        {name:'ct_silver', color:'#94A3B8', from:'100 '+cur, to:'500 '+cur, pct:'10%'},
        {name:'ct_gold', color:'#D97706', from:'500 '+cur, to:'2000 '+cur, pct:'15%'},
        {name:'ct_platinum', color:'#7C3AED', from:'2000 '+cur, to:'∞', pct:'20%'},
      ] };
    }
    const pct = r === 'crypto' ? 15 : 10;
    const minL = Math.round(dep * 0.3);
    const maxA = Math.round(dep * 50);
    return { model:'flat', pct, cur, period:'v_weekly', basis:'v_net_losses', minLoss:`${minL} ${cur}`, maxAmt:`${maxA} ${cur}`, wager:0 };
  })();

  const dep2 = (() => {
    if (r === 'sweep') {
      return { type:'sc_purchase', pct:25, trigger:'v_2nd_purchase', note:'v_sc_purchase_bonus' };
    }
    if (r === 'mn') {
      return { type:'match', pct:75, maxB:30000, minD:5000, cur:'MNT', fs:15, days:30, wager:40, code:'DEP2', trigger:'v_2nd_purchase' };
    }
    if (r === 'eu') {
      const maxB = license === 'ukgc' ? Math.min(100, Math.round(dep * 2)) : Math.max(1000, Math.min(2000, Math.round(dep * 8)));
      const d2fs = license === 'ukgc' ? 0 : 75;
      return { type:'match', pct:75, maxB, minD:welcome.minD, cur, fs:d2fs, days:30, wager:wager.wW, code:'DEP2', trigger:'v_2nd_purchase' };
    }
    if (r === 'latam') {
      const maxB = Math.max(150, Math.min(300, Math.round(dep * 5)));
      return { type:'match', pct:75, maxB, minD:welcome.minD, cur:'USD', fs:50, days:30, wager:wager.wW, code:'DEP2', trigger:'v_2nd_purchase' };
    }
    if (r === 'crypto') {
      const maxB = Math.round(dep * 3);
      return { type:'match', pct:100, maxB, minD:welcome.minD, cur, fs:150, days:60, wager:wager.wW, code:'DEP2', trigger:'v_2nd_purchase' };
    }
    const maxB = Math.round(dep * 3);
    return { type:'match', pct:75, maxB, minD:welcome.minD, cur, fs:75, days:30, wager:wager.wW, code:'DEP2', trigger:'v_2nd_purchase' };
  })();

  const dep3 = (() => {
    if (r === 'sweep') {
      return { type:'sc_purchase', pct:50, trigger:'v_3rd_purchase', note:'v_sc_purchase_bonus' };
    }
    if (r === 'mn') {
      return { type:'match', pct:50, maxB:20000, minD:5000, cur:'MNT', fs:10, days:30, wager:35, code:'DEP3', trigger:'v_3rd_purchase' };
    }
    if (r === 'eu') {
      const maxB = license === 'ukgc' ? Math.min(75, Math.round(dep * 1.5)) : Math.max(500, Math.min(1000, Math.round(dep * 5)));
      const fs = license === 'ukgc' ? 0 : 50;
      return { type:'match', pct:50, maxB, minD:welcome.minD, cur, fs, days:30, wager:Math.max(25, wager.wW - 5), code:'DEP3', trigger:'v_3rd_purchase' };
    }
    if (r === 'latam') {
      const maxB = Math.max(100, Math.min(200, Math.round(dep * 3)));
      return { type:'match', pct:50, maxB, minD:welcome.minD, cur:'USD', fs:30, days:30, wager:Math.max(30, wager.wW - 5), code:'DEP3', trigger:'v_3rd_purchase' };
    }
    if (r === 'crypto') {
      const maxB = Math.round(dep * 2);
      return { type:'match', pct:75, maxB, minD:welcome.minD, cur, fs:100, days:60, wager:wager.wW, code:'DEP3', trigger:'v_3rd_purchase' };
    }
    const maxB = Math.round(dep * 2);
    return { type:'match', pct:50, maxB, minD:welcome.minD, cur, fs:50, days:30, wager:Math.max(30, wager.wW - 5), code:'DEP3', trigger:'v_3rd_purchase' };
  })();

  const contrib = (() => {
    if (r === 'crypto') {
      return [{game:'Slots',pct:100},{game:'Live Casino',pct:10},{game:'Roulette',pct:10},{game:'Blackjack',pct:5},{game:'Video Poker',pct:20},{game:'Crash Games',pct:50},{game:'Keno/Lottery',pct:50}];
    }
    if (r === 'eu') {
      return [{game:'Slots',pct:100},{game:'Slots low RTP',pct:0},{game:'Live Casino',pct:0},{game:'Roulette',pct:0},{game:'Blackjack',pct:0},{game:'Crash Games',pct:0},{game:'Scratch Cards',pct:50}];
    }
    return [{game:'Slots',pct:100},{game:'Slots low RTP',pct:0},{game:'Live Casino',pct:0},{game:'Roulette',pct:0},{game:'Blackjack',pct:0},{game:'Crash Games',pct:50},{game:'Scratch Cards',pct:50}];
  })();

  const fsSpec = r === 'sweep' ? null : {
    count: r === 'mn' ? 50 : r === 'latam' ? 100 : r === 'crypto' ? 200 : 200,
    val: r === 'cis' ? 0.10 : r === 'eu' ? 0.10 : r === 'mn' ? 0.05 : r === 'latam' ? 0.10 : 0.20,
    cur: r === 'crypto' ? 'USDT' : r === 'mn' ? 'EUR' : r === 'latam' ? 'USD' : 'EUR',
    wager: wager.wF,
    games: 'v_slots_only',
    days: r === 'crypto' ? 14 : r === 'mn' ? 7 : 7,
    maxW: '5x_spin_value'
  };

  const arpu = r === 'cis' ? 22 : r === 'eu' ? 65 : r === 'crypto' ? 95 : r === 'mn' ? 12 : r === 'latam' ? 18 : 14;
  const bpct = r === 'cis' ? 0.25 : r === 'eu' ? 0.18 : r === 'crypto' ? 0.28 : r === 'mn' ? 0.22 : r === 'latam' ? 0.30 : 0.45;
  const cac = r === 'cis' ? 8 : r === 'eu' ? 25 : r === 'crypto' ? 40 : r === 'mn' ? 5 : r === 'latam' ? 7 : 4;
  const ltv3 = arpu * 3;
  const mBudget = Math.round(pl * cac);
  const totLTV = Math.round(pl * ltv3);
  const roi3 = Math.round((totLTV - mBudget * 3) / (mBudget * 3) * 100);
  const be = Math.ceil(cac / arpu);

  const mix = {
    cis: [0.85,0.10,0.05,0.00],
    eu: [0.60,0.30,0.05,0.05],
    crypto: [0.50,0.20,0.25,0.05],
    sweep: [0.80,0.15,0.05,0.00],
    mn: [0.80,0.15,0.05,0.00],
    latam: [0.75,0.15,0.10,0.00],
  }[r] || [0.85,0.10,0.05,0.00];
  const wcrs = {
    eu:[1.0,0.0,0.0,0.5],
    crypto:[1.0,0.1,0.5,0.5],
    default:[1.0,0.0,0.5,0.5],
  }[r] || [1.0,0.0,0.5,0.5];
  const rtps = [rt/100,0.99,0.98,0.97];
  const mixedWCR = mix.reduce((s,sh,i)=>s + sh*wcrs[i],0);
  const mixedRTP = mix.reduce((s,sh,i)=>s + sh*rtps[i],0);
  const bonusSize = r === 'sweep' ? (welcome.sc || 50) : Math.min(dep * (welcome.pct||100)/100, welcome.maxB||dep);
  const wagerX = (r === 'sweep' || wager.model === 'none') ? 0 : wager.wW;
  const breakeven_wager = +(mixedWCR / (1 - mixedRTP)).toFixed(1);
  const over_breakeven = wagerX > breakeven_wager;
  const calcScenario = (conv,dWCR,dRTP) => {
    const adjWCR = Math.max(0.01, mixedWCR + dWCR);
    const adjRTP = Math.min(0.999, Math.max(0.5, mixedRTP + dRTP));
    const payout = truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP);
    const cost = Math.round(payout * conv * pl);
    return { conv, wcr:+adjWCR.toFixed(3), rtp:+adjRTP.toFixed(3), turnover:Math.round(bonusSize * wagerX / adjWCR), payout:+payout.toFixed(2), cost };
  };
  const sP10 = calcScenario(0.10, -0.02, -0.005);
  const sP50 = calcScenario(0.20, 0.00, 0.000);
  const sP90 = calcScenario(0.40, 0.02, 0.003);
  const maxRisk = Math.round(pl * bonusSize);
  const stressTest = Math.round(sP50.cost * 1.20);
  const _sv = 0.10;
  const _be = breakeven_wager;
  const _effW = wagerX > 0 ? Math.min(1, _be / Math.max(_be, wagerX)) : 1;
  const _effN = (wager.wN||50) > 0 ? Math.min(1, _be / Math.max(_be, wager.wN||50)) : 1;
  const _effR = (wager.wR||30) > 0 ? Math.min(1, _be / Math.max(_be, wager.wR||30)) : 1;
  const _ndbSize = !ndb || ndb.type==='daily' ? 0 : ndb.type==='combined' ? (ndb.amt||0) + (ndb.fs||0)*_sv : ndb.type==='fs_restricted' ? (ndb.fs||0)*_sv : (ndb.amt||0);
  const _rlBase = reload && reload.pct ? Math.min(dep*(reload.pct/100), reload.maxB||dep) + (reload.fs||0)*_sv : 0;
  const _welcomeCost = bonusSize * _effW * sP50.conv;
  const _ndbCost = _ndbSize * _effN * 0.40;
  const _reloadCost = _rlBase * _effR * 0.05 * 2;
  const totalBonusCost = (_welcomeCost + _ndbCost + _reloadCost) * pl;
  const costRatio = pl*dep > 0 ? totalBonusCost / (pl*dep) : 0;
  let verdictKey = 'verdict_warn';
  if (costRatio < 0.10) verdictKey='verdict_cheap';
  else if (costRatio < 0.25) verdictKey='verdict_ok';
  else if (costRatio < 0.40) verdictKey='verdict_warn';
  else verdictKey='verdict_high';

  const reg = (() => {
    if (r === 'eu' && license==='ukgc') return ['reg_ukgc_1','reg_ukgc_2','reg_ukgc_3','reg_ukgc_4','reg_ukgc_5','reg_ukgc_6'];
    if (r === 'eu' && license==='mga') return ['reg_mga_1','reg_mga_2','reg_mga_3','reg_mga_4','reg_mga_5'];
    if (r === 'sweep') return ['reg_sweep_1','reg_sweep_2','reg_sweep_3','reg_sweep_4','reg_sweep_5'];
    return null;
  })();

  return {
    r, cur, depcur, dep, pl, lic: license, rtp: rt, sc,
    welcome, dep2, dep3, ndb, reload, wager, cashback, contrib, fsSpec,
    econ: { arpu, bpct:+(bpct*100).toFixed(0), cac, ltv3, mBudget, totLTV, roi3, be, pl, bonusSize, mixedWCR:+mixedWCR.toFixed(3), mixedRTP:+mixedRTP.toFixed(4), breakeven_wager, over_breakeven, wagerX, sP10, sP50, sP90, maxRisk, stressTest, costRatio:+costRatio.toFixed(3), verdictKey },
    reg,
  };
}

function recalcCosts(cfg, overrides) {
  const { econ: E, dep, pl, ndb, fsSpec, wager, reload, dep2, dep3, welcome } = cfg;
  const ov = overrides || {};
  const gv = (key, def) => { const v = parseFloat(ov[key]); return (isNaN(v) || v <= 0) ? def : v; };
  const spinV = fsSpec ? fsSpec.val : 0.10;

  function svCost(bonusSize, wagerX, conv, dWCR, dRTP) {
    if (bonusSize <= 0 || wagerX <= 0) return 0;
    const adjWCR = Math.max(0.01, E.mixedWCR + (dWCR || 0));
    const adjRTP = Math.min(0.999, Math.max(0.5, E.mixedRTP + (dRTP || 0)));
    return Math.round(truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP) * conv * pl);
  }

  const w_pct   = gv('w_pct',   welcome.pct  || 100);
  const w_wager = gv('w_wager', E.wagerX);
  const w_maxB  = gv('w_maxB',  welcome.maxB);
  const w_fs    = gv('w_fs',    welcome.fs   || 0);
  const w_bonus = Math.min(dep * w_pct / 100, w_maxB) + w_fs * spinV;
  const c_w_p10 = svCost(w_bonus, w_wager, 0.10, -0.02, -0.005);
  const c_w_p50 = svCost(w_bonus, w_wager, 0.20,  0,     0);
  const c_w_p90 = svCost(w_bonus, w_wager, 0.40, +0.02, +0.003);

  const ndb_wager = gv('ndb_wager', ndb.wager || 50);
  let ndb_size = 0;
  if      (ndb.type === 'fs_restricted') ndb_size = gv('ndb_fs',  ndb.fs  || 10) * spinV;
  else if (ndb.type === 'crypto')        ndb_size = gv('ndb_amt', ndb.amt || 0);
  else if (ndb.type === 'combined')      ndb_size = gv('ndb_amt', ndb.amt || 0) + gv('ndb_fs', ndb.fs || 0) * spinV;
  else if (ndb.amt)                      ndb_size = ndb.type === 'fs' ? gv('ndb_fs', ndb.amt || 0) * spinV : gv('ndb_amt', ndb.amt || 0);
  const c_ndb = svCost(ndb_size, ndb_wager, 0.20, 0, 0);

  const rl_pct   = gv('rl_pct',   reload.pct  || 50);
  const rl_wager = gv('rl_wager', wager.wR    || 35);
  const rl_maxB  = gv('rl_maxB',  reload.maxB || 0);
  const rl_fs    = gv('rl_fs',    reload.fs   || 0);
  const rl_bonus = Math.min(dep * rl_pct / 100, rl_maxB) + rl_fs * spinV;
  const c_rl = svCost(rl_bonus, rl_wager, 0.20, 0, 0);

  const d2_pct   = gv('d2_pct',   dep2.pct   || 75);
  const d2_wager = gv('d2_wager', dep2.wager  || E.wagerX);
  const d2_maxB  = gv('d2_maxB',  dep2.maxB  || 0);
  const d2_fs    = gv('d2_fs',    dep2.fs    || 0);
  const d2_bonus = Math.min(dep * d2_pct / 100, d2_maxB) + d2_fs * spinV;
  const c_d2 = svCost(d2_bonus, d2_wager, 0.20, 0, 0);

  const d3_pct   = gv('d3_pct',   dep3.pct   || 50);
  const d3_wager = gv('d3_wager', dep3.wager  || E.wagerX);
  const d3_maxB  = gv('d3_maxB',  dep3.maxB  || 0);
  const d3_fs    = gv('d3_fs',    dep3.fs    || 0);
  const d3_bonus = Math.min(dep * d3_pct / 100, d3_maxB) + d3_fs * spinV;
  const c_d3 = svCost(d3_bonus, d3_wager, 0.20, 0, 0);

  const fs_wager = gv('fs_wager', fsSpec ? fsSpec.wager : 30);
  const fs_count = gv('fs_count', fsSpec ? fsSpec.count : 0);
  const fs_bonus = fsSpec ? fs_count * fsSpec.val : 0;
  const c_fs = svCost(fs_bonus, fs_wager, 0.20, 0, 0);

  const total = c_w_p50 + c_ndb + c_rl + c_d2 + c_d3 + c_fs;
  return {
    costs: { w_p10: c_w_p10, w_p50: c_w_p50, w_p90: c_w_p90, ndb: c_ndb, rl: c_rl, d2: c_d2, d3: c_d3, fs: c_fs, total },
    ratio: (pl * dep) > 0 ? c_w_p50 / (pl * dep) : 0,
    maxRisk: Math.round(pl * w_bonus),
  };
}

app.post('/api/recalc', (req, res) => {
  try {
    const { cfg, overrides } = req.body || {};
    res.json(recalcCosts(cfg, overrides));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Recalc failed' });
  }
});

app.post('/api/generate', (req,res) => {
  try {
    const cfg = buildConfig(req.body || {});
    res.json({cfg});
  } catch (err) {
    console.error(err);
    res.status(500).json({error:'Could not generate configuration'});
  }
});

const ESC = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.post('/api/signup', async (req, res) => {
  const { name, email, role } = req.body || {};

  if (!email || !EMAIL_RE.test(String(email))) return res.status(400).json({ error: 'valid email required' });
  if (name  && String(name).length  > 200) return res.status(400).json({ error: 'name too long' });
  if (role  && String(role).length  > 100) return res.status(400).json({ error: 'role too long' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'BonusEngine <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL || 'victor.gorinov@gmail.com',
      subject: `New signup: ${ESC(name || 'Anonymous')} — BonusEngine`,
      html: `
        <h2>New Early Access Request</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><b>Name</b></td><td>${ESC(name  || '—')}</td></tr>
          <tr><td><b>Email</b></td><td>${ESC(email)}</td></tr>
          <tr><td><b>Role</b></td><td>${ESC(role  || '—')}</td></tr>
        </table>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ── CAMPAIGN GENERATOR ────────────────────────────────────────────────────────
const campaignLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api/campaign', campaignLimiter);

const GEO_CFG = {
  de: { region:'eu',    lic:'mga',   sitecur:'EUR', depcur:'EUR' },
  fr: { region:'eu',    lic:'mga',   sitecur:'EUR', depcur:'EUR' },
  es: { region:'eu',    lic:'mga',   sitecur:'EUR', depcur:'EUR' },
  it: { region:'eu',    lic:'mga',   sitecur:'EUR', depcur:'EUR' },
  nl: { region:'eu',    lic:'mga',   sitecur:'EUR', depcur:'EUR' },
  uk: { region:'eu',    lic:'ukgc',  sitecur:'GBP', depcur:'GBP' },
  ru: { region:'cis',   lic:'none',  sitecur:'RUB', depcur:'RUB' },
  kz: { region:'cis',   lic:'none',  sitecur:'KZT', depcur:'KZT' },
  us: { region:'sweep', lic:'none',  sitecur:'USD', depcur:'USD' },
  mn: { region:'mn',    lic:'none',  sitecur:'MNT', depcur:'MNT' },
  mx: { region:'latam', lic:'none',  sitecur:'USD', depcur:'USD' },
  br: { region:'latam', lic:'none',  sitecur:'USD', depcur:'USD' },
};

const SCENARIO_MSG = {
  first_launch:     ['Полный бонусный пакет для запуска казино максимизирует конверсию на каждом этапе жизненного цикла игрока', 'Welcome + NDB формируют первое впечатление; Reload удерживает в долгую; Cashback компенсирует потери и снижает churn в первые 90 дней'],
  inactive_3:       ['Reload эффективен при 3-дневном перерыве — игрок ещё помнит платформу и легко конвертируется', 'Короткий срок инактивности снижает CAC на 25–40% vs стандартного бонуса на 1-й депозит'],
  inactive_7:       ['Reload идеален для 7-дневного перерыва: баланс привлекательности и экономической эффективности', '50% match — рыночный стандарт, cost ratio ≈15–20%'],
  inactive_30:      ['После 30+ дней инактивности нужен мощный оффер для возврата — размер бонуса имеет значение', 'Крупный match оправдан высоким retention-эффектом после 30-дневного перерыва (+35%)'],
  churn_risk:       ['Превентивный оффер при риске оттока снижает churn на 20–30% — время действия критично', 'Раннее вмешательство обходится в 3–5 раз дешевле полноценной реактивации'],
  return_win:       ['После крупного выигрыша игрок склонен уйти — Reload мягко возвращает в игровой цикл', 'Фокус на вовлечённость, а не на крупный бонус снижает риск бонусхантинга'],
  return_loss:      ['Cashback после крупного проигрыша снижает фрустрацию и удерживает игрока', 'Возврат % от потерь — наиболее этичный инструмент удержания по требованиям EU-регуляторов'],
  first_dep:        ['Бонус на 1-й депозит — рыночный стандарт, максимизирует конверсию новых игроков', 'Условия 1-го депозита определяют LTV первого года: % и вейджер критически важны для unit-экономики'],
  second_dep:       ['2-й депозитный бонус фиксирует игровую привычку в первую неделю после регистрации', 'Удержание после 2-го депозита коррелирует с LTV 3 мес. в 2.3× выше нормы'],
  big_dep:          ['Крупный депозит сигнализирует о высоком LTV-потенциале — оффер должен соответствовать уровню', 'Персонализированные условия при крупном депозите конвертируют в 40% случаев'],
  vip_retention:    ['VIP-удержание требует персонального подхода — Cashback без вейджера является стандартом', 'Высокий cashback без вейджера — рыночная норма для VIP-сегмента, ожидание игрока'],
  vip_reactivation: ['Реактивация VIP требует значительного оффера для возврата высокодоходного игрока', 'ROI от возврата одного VIP покрывает CAC 10–15 стандартных игроков'],
  sport_event:      ['Фрибет привязан к конкретному событию — создаёт срочность и FOMO-эффект', 'Событийный маркетинг конвертирует спортивную аудиторию в 2.5× эффективнее обычного пуша'],
  tournament:       ['Турнирный формат создаёт долгосрочную вовлечённость через соревновательный элемент', 'Призовой фонд с фиксированным бюджетом — предсказуемый cost ratio без хвостового риска'],
  cashback:         ['Cashback без вейджера — наиболее прозрачный инструмент, лояльный для игрока и регулятора', 'EU/UK регуляторы всё строже требуют отказа от вейджера — cashback опережает тренд'],
  custom:           ['Базовая механика подобрана по параметрам вашего региона и сегмента аудитории', 'Дополнительная настройка параметров доступна на предыдущем экране'],
};

function campaignExplanation(scenarioId, mechanicType, cfg, requestedTypes = []) {
  const [m1, m2] = SCENARIO_MSG[scenarioId] || SCENARIO_MSG['inactive_7'];
  const licStr = cfg.lic === 'ukgc' ? 'UKGC' : cfg.lic === 'mga' ? 'MGA' : 'Curaçao';
  const regStr = { eu:`EU/${licStr}`, cis:'СНГ', crypto:'Crypto', mn:'Монголия', latam:'LatAm', sweep:'USA Sweep' }[cfg.r] || cfg.r;

  if (requestedTypes.length > 1) {
    const lblMap = { welcome:'1-й депозит', ndb:'Welcome', reload:'Reload', dep2:'2-й депозит', dep3:'3-й депозит', cashback:'Cashback' };
    const mix = requestedTypes.map(t => lblMap[t] || t).join(' + ');
    const hasCashback = requestedTypes.includes('cashback');
    const isFullLaunch = scenarioId === 'first_launch';
    return [
      isFullLaunch
        ? `Пакет запуска казино для ${regStr}: все 6 механик покрывают путь игрока от регистрации до долгосрочного удержания`
        : `Комбинация ${mix} покрывает полный жизненный цикл игрока в рамках одной кампании`,
      m1,
      isFullLaunch
        ? `NDB снижает барьер входа → Welcome конвертирует депозит → 2-й/3-й деп фиксируют привычку → Reload удерживает еженедельно → Cashback страхует от оттока`
        : hasCashback
          ? 'Cashback без вейджера компенсирует агрессивность других механик и снижает риск регуляторных претензий'
          : `Единый вейджерный порог ×${cfg.wager?.wW||35} применяется ко всем механикам региона ${regStr}`,
      `Переключайтесь между табами, чтобы просмотреть параметры каждой механики отдельно`,
    ];
  }

  const wStr = mechanicType === 'cashback'
    ? 'Cashback без вейджера повышает trust score игрока и снижает жалобы на 40%'
    : `Вейджер ×${cfg.wager?.wW || 35} рассчитан по Truncated Normal — оптимальный баланс выплат и маржи`;
  return [m1, m2, `Параметры адаптированы под регион ${regStr} и лицензионные требования`, wStr];
}

function campaignAlternatives(cfg, requestedTypes = []) {
  const cur = cfg.cur;
  const allM = { welcome:cfg.welcome, ndb:cfg.ndb, reload:cfg.reload, dep2:cfg.dep2, dep3:cfg.dep3, cashback:cfg.cashback };
  const excluded = new Set(requestedTypes);
  const info = {
    welcome:  m => ({ icon:'💰', name:`1-й депозит ${m.pct||100}% до ${m.maxB||'?'} ${m.cur||cur}`, desc:'Бонус на первый депозит — максимизирует конверсию' }),
    ndb:      m => ({ icon:'🎁', name:`Welcome ${m.fs||m.amt||30}${m.fs?' FS':''}`, desc:'Welcome-бонус без депозита при регистрации' }),
    reload:   m => ({ icon:'🔄', name:`Reload ${m.pct||50}% до ${m.maxB||'?'} ${m.cur||cur}`, desc:'Еженедельный бонус для удержания' }),
    dep2:     m => ({ icon:'💰', name:`2-й депозит ${m.pct||75}%`, desc:'Фиксирует игровую привычку в 1-ю неделю' }),
    dep3:     m => ({ icon:'🎁', name:`3-й депозит ${m.pct||50}%`, desc:'Завершает депозитную серию' }),
    cashback: m => ({ icon:'💳', name:`Cashback ${m.pct||10}%`, desc:'Возврат от потерь без вейджера' }),
  };
  return Object.entries(info)
    .filter(([t]) => !excluded.has(t) && allM[t])
    .map(([t, fn]) => ({ ...fn(allM[t]), type:t }))
    .slice(0, 3);
}

app.post('/api/campaign/generate', async (req, res) => {
  const { scenario, params } = req.body || {};
  if (!params || typeof params !== 'object') return res.status(400).json({ error: 'params required' });

  const geoCfg  = GEO_CFG[String(params.geo || 'de')] || GEO_CFG['de'];
  const avgdep  = { new:40, mid:100, vip:500 }[params.segment] || 100;
  const players = { low:1000, mid:5000, high:10000 }[params.agg] || 5000;
  const rtp     = { slots:96, table:98, live:99 }[params.games] || 96;
  // risk=low → +10 wager (stricter → lower cost ratio → safer verdict)
  // risk=high → -8 wager (looser → higher cost ratio → aggressive offer)
  const RISK_ADJ = { low: 10, mid: 0, high: -8 };
  const riskAdj = RISK_ADJ[params.risk] ?? 0;

  const cfg = buildConfig({ ...geoCfg, players, avgdep, plat:'both', rtp, riskAdj });

  const id = String(scenario?.id || 'inactive_7');
  let scenarioType;
  if (['first_dep','first_launch'].includes(id))                                       scenarioType = 'welcome';
  else if (id === 'second_dep')                                                        scenarioType = 'dep2';
  else if (['cashback','return_loss','vip_retention','vip_reactivation'].includes(id)) scenarioType = 'cashback';
  else                                                                                 scenarioType = 'reload';

  const allMechanics = { welcome:cfg.welcome, ndb:cfg.ndb, reload:cfg.reload, dep2:cfg.dep2, dep3:cfg.dep3, cashback:cfg.cashback };

  // Use user-selected bonusTypes or fall back to scenario
  const validTypes = new Set(Object.keys(allMechanics));
  const requestedTypes = Array.isArray(params.bonusTypes) && params.bonusTypes.length > 0
    ? params.bonusTypes.filter(t => validTypes.has(t) && allMechanics[t])
    : [scenarioType];
  const finalTypes  = requestedTypes.length ? requestedTypes : [scenarioType];
  const primaryType = finalTypes[0];

  const selectedMechanics = {};
  finalTypes.forEach(t => { if (allMechanics[t]) selectedMechanics[t] = allMechanics[t]; });

  res.json({
    mechanic:          selectedMechanics[primaryType],
    mechanicType:      primaryType,
    requestedTypes:    finalTypes,
    selectedMechanics,
    allMechanics,
    explanation:       campaignExplanation(id, primaryType, cfg, finalTypes),
    alternatives:      campaignAlternatives(cfg, finalTypes),
    econ:              cfg.econ,
    wager:             cfg.wager,
    fsSpec:            cfg.fsSpec,
    contrib:           cfg.contrib,
    reg:               cfg.reg,
    cur:               cfg.cur,
    r:                 cfg.r,
  });
});

// ── AI TEXT GENERATION ────────────────────────────────────────────────────────
const aiLimiter = rateLimit({ windowMs: 60_000, max: 15, standardHeaders: true, legacyHeaders: false });

const TONE_DESC = { friendly:'friendly, warm and personal', pro:'professional and trustworthy', aggressive:'urgent, bold, FOMO-driven' };
const LANG_NAME = { de:'German', en:'English', ru:'Russian', es:'Spanish', mn:'Mongolian' };
const SEG_DESC  = { new:'new players (first-timers)', mid:'regular players', vip:'VIP high-value players' };

function bonusLine(mech, type) {
  if (!mech) return 'bonus offer';
  if (type === 'cashback') return `Cashback ${mech.pct||10}% of losses, no wagering`;
  if (type === 'ndb')      return `Welcome: ${mech.fs||mech.amt||30}${mech.fs?' free spins':''} no deposit, wager ×${mech.wager||50}`;
  return `${mech.pct||100}% match up to ${mech.maxB||'?'} ${mech.cur||''}${mech.fs?`, ${mech.fs} free spins`:''}, min dep ${mech.minD||'?'} ${mech.cur||''}, wager ×${mech.wager||35}, ${mech.days||30} days${mech.code?`, code: ${mech.code}`:''}`;
}

function tryRepairJSON(s) {
  try {
    const opens = [];
    let inStr = false, esc = false;
    for (const c of s) {
      if (esc)             { esc = false; continue; }
      if (c==='\\' && inStr){ esc = true;  continue; }
      if (c==='"')         { inStr = !inStr; continue; }
      if (inStr)           continue;
      if (c==='{' || c==='[') opens.push(c==='{'?'}':']');
      else if ((c==='}'||c===']') && opens.length) opens.pop();
    }
    let repaired = s;
    if (inStr) repaired += '"';                          // close open string
    for (let i = opens.length-1; i >= 0; i--) repaired += opens[i]; // close brackets
    return JSON.parse(repaired);
  } catch(_) { return null; }
}

function parseAI(text) {
  const s = text.trim();
  const raw = s.startsWith('```') ? s.replace(/```json?\n?/g,'').replace(/```/g,'').trim() : s;
  try {
    return JSON.parse(raw);
  } catch(e) {
    const repaired = tryRepairJSON(raw);
    if (repaired) return repaired;
    throw e;
  }
}

app.post('/api/campaign/texts', aiLimiter, async (req, res) => {
  const { scenario, mechanic, mechanicType, params } = req.body || {};
  if (!params) return res.status(400).json({ error: 'params required' });

  const geo   = GEO_CFG[params.geo] || GEO_CFG['de'];
  const lang  = LANG_NAME[params.lang] || 'English';
  const tone  = TONE_DESC[params.tone] || TONE_DESC.friendly;
  const seg   = SEG_DESC[params.segment] || SEG_DESC.mid;
  const bonus = bonusLine(mechanic, mechanicType);
  const lic   = (geo.lic || 'none').toUpperCase();

  const prompt = `You are a senior CRM marketing expert for an online casino. Generate 3 compelling variants (A, B, C) for each communication channel.

Campaign context:
- Scenario: ${scenario?.lbl || 'Player reactivation'}
- Bonus: ${bonus}
- Region: ${params.geo?.toUpperCase()} / License: ${lic}
- Audience: ${seg}
- Language: ${lang}
- Tone: ${tone}

Return ONLY valid JSON, no markdown, no extra text:
{
  "push": ["<70-100 chars, 1-2 emojis>", "variant B", "variant C"],
  "email": [
    {"subject": "<45-60 chars>", "body": "<60-90 words, include 1 T&C sentence>"},
    {"subject": "...", "body": "..."},
    {"subject": "...", "body": "..."}
  ],
  "sms": ["<MAX 160 chars, end: STOP>", "variant B", "variant C"],
  "telegram": ["<*bold* _italic_, 120-200 chars>", "variant B", "variant C"],
  "popup": [
    {"headline": "<max 45 chars>", "subtext": "<max 75 chars>", "cta": "<max 22 chars, button text>"},
    {"headline": "...", "subtext": "...", "cta": "..."},
    {"headline": "...", "subtext": "...", "cta": "..."}
  ]
}
All texts in ${lang}. Include bonus code and key conditions in every variant.`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role:'user', content: prompt }],
    });
    res.json(parseAI(msg.content[0].text));
  } catch(err) {
    console.error('Texts AI error:', err.message);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

app.post('/api/campaign/audit', aiLimiter, async (req, res) => {
  const { scenario, mechanic, mechanicType, params, uiLang } = req.body || {};
  if (!params) return res.status(400).json({ error: 'params required' });

  const geo   = GEO_CFG[params.geo] || GEO_CFG['de'];
  const lic   = (geo.lic || 'none').toUpperCase();
  const bonus = bonusLine(mechanic, mechanicType);
  const lang  = LANG_NAME[uiLang] || LANG_NAME[params.lang] || 'English';

  const prompt = `You are a gambling compliance officer. Audit this CRM bonus campaign for risks and compliance issues.

Campaign: ${scenario?.lbl || 'Reactivation'}
Bonus: ${bonus}
Region: ${params.geo?.toUpperCase()}, License: ${lic}
Segment: ${SEG_DESC[params.segment]||'regular players'}, Risk: ${params.risk||'low'}

IMPORTANT: Write ALL text fields (label, note, text, impact) in ${lang}.

Audit 5 aspects. Return ONLY valid JSON, no markdown:
{
  "checks": [
    {"label": "<aspect name in ${lang}>", "status": "ok",      "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"}
  ],
  "recommendations": [
    {"text": "<specific actionable fix in ${lang}, under 95 chars>", "impact": "<expected benefit in ${lang}, under 55 chars>"}
  ]
}
Give 2-4 recommendations. Be specific to the actual bonus parameters and region.`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      messages: [{ role:'user', content: prompt }],
    });
    res.json(parseAI(msg.content[0].text));
  } catch(err) {
    console.error('Audit AI error:', err.message);
    res.status(500).json({ error: err.message || 'Audit failed' });
  }
});

app.get('/api/health', (req,res) => res.json({status:'ok'}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bonus System API running at http://localhost:${port}`);
});
