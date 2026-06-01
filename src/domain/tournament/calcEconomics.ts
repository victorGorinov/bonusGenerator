import { GEO_CFG } from '../campaign/scenarios.js';

// Returns local-currency units per 1 USD for a given geo + sitecur.
// Priority: GEO_CFG.avgdepUSD (derived from real deposit benchmarks) → STABLE_USD_TO_LOCAL.
function deriveLocalFxRate(sitecur: string, geo?: string): number {
  if (geo) {
    const cfg = GEO_CFG[geo];
    if (cfg?.avgdep && cfg.avgdepUSD) {
      // Implied rate: local avgdep.mid / USD avgdep.mid
      return cfg.avgdep.mid / cfg.avgdepUSD.mid;
    }
  }
  return STABLE_USD_TO_LOCAL[sitecur] ?? 1;
}

const ARPU_BY_REGION: Record<string, number> = {
  eu: 65, cis: 22, mn: 12, sweep: 30, crypto: 80, latam: 18,
};

// Financial FX rates for currencies without GEO_CFG.avgdepUSD.
// Only USD-pegged and major Western currencies — these are stable enough to hardcode.
// All others derive their rate from GEO_CFG.avgdep / avgdepUSD (see deriveLocalFxRate).
const STABLE_USD_TO_LOCAL: Record<string, number> = {
  USD:  1.00,
  USDT: 1.00,
  SC:   1.00,
  EUR:  0.92,
  GBP:  0.79,
  BTC:  0.000015,
  ETH:  0.00042,
};

const SEGMENT_RATIO: Record<string, number> = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

const DURATION_DAYS: Record<string, number> = {
  flash: 0.03, daily: 1, weekly: 7, monthly: 30, multi_round: 10,
};

/**
 * Engagement multiplier — how much more than their normal daily ARPU
 * tournament participants spend during the event.
 *
 * Industry benchmarks: tournament players play 2–3× more intensively
 * (more spins, longer sessions, daily check-ins to track leaderboard).
 * Longer formats produce higher cumulative lift.
 */
const ENGAGEMENT_LIFT: Record<string, number> = {
  flash:       2.0,  // concentrated burst — 2× in under 1 hour
  daily:       1.8,  // elevated daily activity
  weekly:      2.5,  // players return daily to track position
  monthly:     3.0,  // highest sustained engagement, repeat sessions
  multi_round: 2.8,  // elimination mechanics drive repeat daily play
};

/**
 * Participation rates by duration.
 * Longer / better-marketed formats achieve higher opt-in rates.
 */
const PARTICIPATION_RATES: Record<string, { low: number; mid: number; high: number }> = {
  flash:       { low: 0.03, mid: 0.07, high: 0.12 },
  daily:       { low: 0.05, mid: 0.10, high: 0.18 },
  weekly:      { low: 0.08, mid: 0.15, high: 0.25 },
  monthly:     { low: 0.10, mid: 0.18, high: 0.30 },
  multi_round: { low: 0.06, mid: 0.12, high: 0.20 },
};

/**
 * Post-tournament retention lift — fraction of participants who show
 * increased monthly deposit activity in the following 30 days.
 * Tournaments build habit and loyalty, especially for new and dormant players.
 */
const RETENTION_LIFT: Record<string, number> = {
  all:        0.08,
  new:        0.15,  // tournament creates first deposit habit
  vip:        0.05,  // already retained; marginal uplift
  dormant:    0.20,  // most effective reactivation tool in iGaming
  depositors: 0.10,
};

export interface TournamentEconomics {
  arpu:                  number;
  totalPlayers:          number;
  segmentRatio:          number;
  eligible:              number;
  durationDays:          number;
  engagementMultiplier:  number;  // lift factor applied to daily ARPU
  participantsLow:       number;
  participantsMid:       number;
  participantsHigh:      number;
  ggrLiftLow:            number;
  ggrLiftMid:            number;
  ggrLiftHigh:           number;
  retentionValue:        number;  // post-tournament incremental monthly GGR (mid scenario)
  prizePoolCost:         number;
  netMarginLow:          number;  // ggrLift − prizePoolCost
  netMarginMid:          number;
  netMarginHigh:         number;
  totalValueMid:         number;  // netMarginMid + retentionValue (full economic picture)
  costPerActiveLow:      number;
  costPerActiveMid:      number;
  costPerActiveHigh:     number;
  roi:                   number;  // based on totalValueMid
  breakEvenParticipants: number;
}

export function calcTournamentEconomics(params: {
  region:        string;
  segment:       string;
  duration:      string;
  prizePool:     number;
  poolModel:     string;
  rake?:         number;
  totalPlayers?: number;
  sitecur?:      string;   // site currency — used to convert USD ARPU to local currency
  geo?:          string;   // geo code — enables GEO_CFG-derived FX rate
}): TournamentEconomics {
  const fxRate       = deriveLocalFxRate(params.sitecur ?? 'USD', params.geo);
  const arpu         = Math.round((ARPU_BY_REGION[params.region] ?? ARPU_BY_REGION['eu']) * fxRate * 100) / 100;
  const totalPlayers = params.totalPlayers ?? 5000;
  const segmentRatio = SEGMENT_RATIO[params.segment] ?? 1.0;
  const eligible     = Math.round(totalPlayers * segmentRatio);
  const durationDays = DURATION_DAYS[params.duration] ?? 7;

  const rates  = PARTICIPATION_RATES[params.duration]  ?? PARTICIPATION_RATES['weekly'];
  const engMul = ENGAGEMENT_LIFT[params.duration]       ?? 2.5;
  const retLift = RETENTION_LIFT[params.segment]        ?? 0.08;

  const participantsLow  = Math.round(eligible * rates.low);
  const participantsMid  = Math.round(eligible * rates.mid);
  const participantsHigh = Math.round(eligible * rates.high);

  // GGR lift = players × (daily ARPU × engagement multiplier) × days
  const revenuePerPlayerPerDay = arpu / 30;
  const ggrLiftLow  = Math.round(participantsLow  * revenuePerPlayerPerDay * engMul * durationDays);
  const ggrLiftMid  = Math.round(participantsMid  * revenuePerPlayerPerDay * engMul * durationDays);
  const ggrLiftHigh = Math.round(participantsHigh * revenuePerPlayerPerDay * engMul * durationDays);

  // Post-tournament retention: fraction of participants with improved next-month value
  const retentionValue = Math.round(participantsMid * retLift * arpu);

  const rake = params.rake ?? 0;
  let prizePoolCost: number;
  if      (params.poolModel === 'fixed')   prizePoolCost = params.prizePool;
  else if (params.poolModel === 'dynamic') prizePoolCost = params.prizePool * (1 - rake / 100);
  else                                     prizePoolCost = params.prizePool * 0.6; // hybrid

  prizePoolCost = Math.round(prizePoolCost);

  const netMarginLow  = ggrLiftLow  - prizePoolCost;
  const netMarginMid  = ggrLiftMid  - prizePoolCost;
  const netMarginHigh = ggrLiftHigh - prizePoolCost;
  const totalValueMid = netMarginMid + retentionValue;

  const costPerActiveLow  = participantsLow  > 0 ? Math.round(prizePoolCost / participantsLow)  : 0;
  const costPerActiveMid  = participantsMid  > 0 ? Math.round(prizePoolCost / participantsMid)  : 0;
  const costPerActiveHigh = participantsHigh > 0 ? Math.round(prizePoolCost / participantsHigh) : 0;

  // ROI based on full economic value (GGR + retention) vs prize pool cost
  const roi = prizePoolCost > 0 ? Math.round((totalValueMid / prizePoolCost) * 100) : 0;

  // Break-even: how many participants needed for GGR alone to cover prize pool
  const ggrPerParticipantPerDay = revenuePerPlayerPerDay * engMul;
  const breakEvenParticipants = ggrPerParticipantPerDay * durationDays > 0
    ? Math.ceil(prizePoolCost / (ggrPerParticipantPerDay * durationDays))
    : 0;

  return {
    arpu, totalPlayers, segmentRatio, eligible, durationDays,
    engagementMultiplier: engMul,
    participantsLow, participantsMid, participantsHigh,
    ggrLiftLow, ggrLiftMid, ggrLiftHigh,
    retentionValue,
    prizePoolCost,
    netMarginLow, netMarginMid, netMarginHigh,
    totalValueMid,
    costPerActiveLow, costPerActiveMid, costPerActiveHigh,
    roi, breakEvenParticipants,
  };
}
