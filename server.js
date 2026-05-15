import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: '64kb' }));
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
  const { region, players, sitecur, depcur, avgdep, plat, lic, rtp } = params;
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
      return { type:'match', pct:100, maxB:100000, minD:3000, cur:'MNT', fs:50, days:60, code:'WELCOME100', trigger:'v_first_dep' };
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
      return { type:'combined', amt:5000, fs:30, ndCur:'MNT', wager:50, maxW_x:5, days:7, limit:'v_1_per_account', trigger:'v_reg_verify' };
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
      return { type:'match', pct:50, maxB:5000, minD:5000, cur:'MNT', fs:10, freq:'v_weekly', day:'v_day_sat', limit:'v_1_per_period', code:'RELOAD50' };
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
      return { model:'standard', wW:40, wN:50, wR:35, wF:30, mb:'v_no_limit', days:60, basis:'v_bonus_only', games:'v_slots_only', gameRtp:rt }; 
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

app.get('/api/health', (req,res) => res.json({status:'ok'}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bonus System API running at http://localhost:${port}`);
});
