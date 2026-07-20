/**
 * Client-side port of src/domain/wheel/ (buildWheel.ts + calcEconomics.ts + presets.ts).
 * Keep in sync with the server implementation — parity test: tests/domain/wheel.econ.parity.test.js
 */

// ── Truncated-Normal payout (mirror of src/domain/bonus/payout.ts) ──────────
function _erf(x) {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
function _phi(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
function _Phi(z) { return 0.5 * (1 + _erf(z / Math.SQRT2)); }
function truncNormalPayout(B, W, adjWCR, adjRTP) {
  if (B <= 0 || W <= 0) return 0;
  const be    = adjWCR / (1 - adjRTP);
  const mu    = B * (1 - W / be);
  const sigma = Math.sqrt(W * B / adjWCR);
  const z     = mu / sigma;
  return Math.max(0, mu * _Phi(z) + sigma * _phi(z));
}

// ── FX / ARPU / segment tables (mirror of tournament/calcEconomics.ts) ──────
const ARPU_BY_REGION = { eu: 65, cis: 22, mn: 12, sweep: 30, crypto: 80, latam: 18 };
const STABLE_USD_TO_LOCAL = {
  USD: 1.00, USDT: 1.00, SC: 1.00, EUR: 0.92, GBP: 0.79, DKK: 7.37,
  RUB: 90.9, KZT: 500, MNT: 3448, BRL: 5.5, MXN: 18.5, COP: 4100,
  ARS: 1050, PEN: 3.75, CLP: 950, BTC: 0.000015, ETH: 0.00042,
};
const GEO_AVGDEP_USD = {
  dk: { avgdep: 700, avgdepUSD: 95 }, ru: { avgdep: 5000, avgdepUSD: 55 },
  kz: { avgdep: 20000, avgdepUSD: 40 }, mn: { avgdep: 100000, avgdepUSD: 29 },
};
function deriveLocalFxRate(sitecur, geo) {
  if (geo) {
    const cfg = GEO_AVGDEP_USD[geo];
    if (cfg && cfg.avgdep && cfg.avgdepUSD) return cfg.avgdep / cfg.avgdepUSD;
  }
  return STABLE_USD_TO_LOCAL[sitecur] ?? 1;
}

const SEGMENT_RATIO = { all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60 };
const SPINS_PER_MONTH = { on_deposit: 1.5, daily: 22, weekly: 4, one_time: 1 };
const PARTICIPATION_RATES = {
  on_deposit: { low: 0.25, mid: 0.40, high: 0.60 },
  daily:      { low: 0.20, mid: 0.35, high: 0.55 },
  weekly:     { low: 0.15, mid: 0.28, high: 0.45 },
  one_time:   { low: 0.30, mid: 0.50, high: 0.70 },
};
const ENGAGEMENT_LIFT = { on_deposit: 0.05, daily: 0.15, weekly: 0.08, one_time: 0.03 };
const RETENTION_LIFT = { all: 0.06, new: 0.12, vip: 0.05, dormant: 0.16, depositors: 0.08 };

// ── Presets (mirror of presets.ts) ──────────────────────────────────────────
export const WHEEL_PRESETS = {
  welcome: {
    label: 'Welcome Wheel', defaultFrequency: 'on_deposit',
    segments: [
      { prizeType: 'free_spins',  weight: 30, mult: 20,   labelKey: 'fs_20' },
      { prizeType: 'free_spins',  weight: 20, mult: 50,   labelKey: 'fs_50' },
      { prizeType: 'bonus_money', weight: 25, mult: 0.5,  labelKey: 'bm_half' },
      { prizeType: 'bonus_money', weight: 15, mult: 1.0,  labelKey: 'bm_one' },
      { prizeType: 'cashback',    weight: 8,  mult: 0.10, labelKey: 'cb_10' },
      { prizeType: 'jackpot',     weight: 2,  mult: 5.0,  labelKey: 'jp_5x' },
    ],
  },
  daily: {
    label: 'Daily Wheel', defaultFrequency: 'daily',
    segments: [
      { prizeType: 'nothing',     weight: 25, mult: 0,    labelKey: 'none' },
      { prizeType: 'free_spins',  weight: 30, mult: 10,   labelKey: 'fs_10' },
      { prizeType: 'free_spins',  weight: 15, mult: 25,   labelKey: 'fs_25' },
      { prizeType: 'cashback',    weight: 15, mult: 0.05, labelKey: 'cb_5' },
      { prizeType: 'bonus_money', weight: 12, mult: 0.2,  labelKey: 'bm_fifth' },
      { prizeType: 'bonus_money', weight: 3,  mult: 0.5,  labelKey: 'bm_half' },
    ],
  },
  vip: {
    label: 'VIP Wheel', defaultFrequency: 'weekly',
    segments: [
      { prizeType: 'free_spins',  weight: 25, mult: 50,   labelKey: 'fs_50' },
      { prizeType: 'bonus_money', weight: 25, mult: 1.0,  labelKey: 'bm_one' },
      { prizeType: 'bonus_money', weight: 20, mult: 2.0,  labelKey: 'bm_two' },
      { prizeType: 'cashback',    weight: 15, mult: 0.15, labelKey: 'cb_15' },
      { prizeType: 'multiplier',  weight: 10, mult: 2.0,  labelKey: 'mult_2' },
      { prizeType: 'jackpot',     weight: 5,  mult: 10.0, labelKey: 'jp_10x' },
    ],
  },
};

export function materializeSegments(presetKey, avgDeposit) {
  const preset = WHEEL_PRESETS[presetKey] || WHEEL_PRESETS.welcome;
  return preset.segments.map((s) => {
    let prizeValue;
    switch (s.prizeType) {
      case 'bonus_money': case 'jackpot': case 'physical':
        prizeValue = Math.round(s.mult * avgDeposit); break;
      case 'free_spins': prizeValue = Math.round(s.mult); break;
      case 'cashback':   prizeValue = s.mult; break;
      case 'multiplier': prizeValue = s.mult; break;
      default:           prizeValue = 0;
    }
    return { labelKey: s.labelKey, prizeType: s.prizeType, weight: s.weight, prizeValue };
  });
}

// ── Cost model (mirror of buildWheel.ts) ────────────────────────────────────
export function segmentCost(seg, ctx) {
  switch (seg.prizeType) {
    case 'bonus_money':
      return truncNormalPayout(seg.prizeValue, ctx.wager, ctx.wcr, ctx.rtp);
    case 'multiplier': {
      const extra = Math.max(0, (seg.prizeValue - 1)) * ctx.avgDeposit;
      return truncNormalPayout(extra, ctx.wager, ctx.wcr, ctx.rtp);
    }
    case 'free_spins': return seg.prizeValue * ctx.betValue * ctx.rtp;
    case 'cashback':   return seg.prizeValue * ctx.avgDeposit;
    case 'jackpot': case 'physical': return seg.prizeValue;
    case 'nothing':    return 0;
    default:           return 0;
  }
}

export function wheelExpectedValue(segments, ctx) {
  const totalWeight = segments.reduce((s, seg) => s + Math.max(0, seg.weight), 0);
  if (totalWeight <= 0) return 0;
  return segments.reduce((sum, seg) => sum + (Math.max(0, seg.weight) / totalWeight) * segmentCost(seg, ctx), 0);
}

export function wheelTopPrizeCost(segments, ctx) {
  return segments.reduce((mx, seg) => Math.max(mx, segmentCost(seg, ctx)), 0);
}

// ── Economics (mirror of calcEconomics.ts) ──────────────────────────────────
export function calcWheelEconomics(params) {
  const fxRate = deriveLocalFxRate(params.sitecur ?? 'USD', params.geo);
  const arpu   = Math.round((ARPU_BY_REGION[params.region] ?? ARPU_BY_REGION['eu']) * fxRate * 100) / 100;

  const segmentRatio = SEGMENT_RATIO[params.segment] ?? 1.0;
  const eligible     = Math.round(params.players * segmentRatio);

  const rtp      = params.rtp ?? 0.96;
  const betValue = params.betValue ?? Math.max(0.1, Math.round(0.2 * fxRate * 100) / 100);
  const ctx = {
    avgDeposit: params.avgDeposit, betValue,
    wager: params.wager ?? 30, wcr: params.wcr ?? 1.0, rtp,
  };

  const evPerSpin    = wheelExpectedValue(params.segments, ctx);
  const topPrizeCost = wheelTopPrizeCost(params.segments, ctx);

  const rates   = PARTICIPATION_RATES[params.frequency] ?? PARTICIPATION_RATES['daily'];
  const spins   = SPINS_PER_MONTH[params.frequency]     ?? SPINS_PER_MONTH['daily'];
  const engLift = ENGAGEMENT_LIFT[params.frequency]     ?? 0.10;
  const retLift = RETENTION_LIFT[params.segment]        ?? 0.06;

  const participantsLow  = Math.round(eligible * rates.low);
  const participantsMid  = Math.round(eligible * rates.mid);
  const participantsHigh = Math.round(eligible * rates.high);

  const programCostLow  = Math.round(participantsLow  * spins * evPerSpin);
  const programCostMid  = Math.round(participantsMid  * spins * evPerSpin);
  const programCostHigh = Math.round(participantsHigh * spins * evPerSpin);

  const ggrUpliftMid   = Math.round(participantsMid * arpu * engLift);
  const retentionValue = Math.round(participantsMid * arpu * retLift);
  const totalValueMid  = ggrUpliftMid + retentionValue;
  const netResultMid   = totalValueMid - programCostMid;

  const costRatio = participantsMid * arpu > 0
    ? Math.round((programCostMid / (participantsMid * arpu)) * 1000) / 10
    : 0;
  const costPerActiveMid = participantsMid > 0 ? Math.round(programCostMid / participantsMid) : 0;
  const maxRisk = Math.round(programCostMid + topPrizeCost);
  const roi = programCostMid > 0 ? Math.round((totalValueMid / programCostMid) * 100) : 0;

  const valuePerParticipant = arpu * (engLift + retLift);
  const breakEvenParticipants = valuePerParticipant > 0 ? Math.ceil(programCostMid / valuePerParticipant) : 0;

  return {
    arpu, eligible, segmentRatio, frequency: params.frequency,
    spinsPerParticipant: spins,
    evPerSpin: Math.round(evPerSpin * 100) / 100,
    topPrizeCost: Math.round(topPrizeCost),
    participationRate: rates.mid,
    participantsLow, participantsMid, participantsHigh,
    programCostLow, programCostMid, programCostHigh,
    ggrUpliftMid, retentionValue, totalValueMid, netResultMid,
    costRatio, costPerActiveMid, maxRisk, roi, breakEvenParticipants,
  };
}

if (typeof window !== 'undefined') {
  window._wheelEcon = {
    calcWheelEconomics, wheelExpectedValue, segmentCost, wheelTopPrizeCost,
    materializeSegments, WHEEL_PRESETS,
  };
}
