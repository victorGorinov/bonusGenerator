import { deriveLocalFxRate, ARPU_BY_REGION } from '../tournament/calcEconomics.js';
import {
  wheelExpectedValue, wheelTopPrizeCost,
  type WheelSegment, type WheelCostContext,
} from './buildWheel.js';
import type { WheelFrequency } from './presets.js';

// Fraction of a region's player base in each segment (mirrors tournament model).
const SEGMENT_RATIO: Record<string, number> = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

// Spins one participant takes per month, by cadence.
const SPINS_PER_MONTH: Record<WheelFrequency, number> = {
  on_deposit: 1.5,   // ≈ deposits/month
  daily:      22,    // engaged days/month
  weekly:     4,
  one_time:   1,
};

// Opt-in rate — fraction of eligible players who actually spin.
// Daily-reward mechanics pull the highest engagement.
const PARTICIPATION_RATES: Record<WheelFrequency, { low: number; mid: number; high: number }> = {
  on_deposit: { low: 0.25, mid: 0.40, high: 0.60 },
  daily:      { low: 0.20, mid: 0.35, high: 0.55 },
  weekly:     { low: 0.15, mid: 0.28, high: 0.45 },
  one_time:   { low: 0.30, mid: 0.50, high: 0.70 },
};

// Gamification GGR uplift — incremental monthly revenue per participant as a
// fraction of ARPU. More frequent cadences build a stronger play habit.
const ENGAGEMENT_LIFT: Record<WheelFrequency, number> = {
  on_deposit: 0.05,
  daily:      0.15,
  weekly:     0.08,
  one_time:   0.03,
};

// Post-program retention lift — fraction of participants with improved next-month value.
const RETENTION_LIFT: Record<string, number> = {
  all: 0.06, new: 0.12, vip: 0.05, dormant: 0.16, depositors: 0.08,
};

export interface WheelEconomics {
  arpu:               number;   // site currency / month
  eligible:           number;
  segmentRatio:       number;
  frequency:          WheelFrequency;
  spinsPerParticipant: number;
  evPerSpin:          number;   // site currency
  topPrizeCost:       number;   // site currency
  participationRate:  number;   // mid
  participantsLow:    number;
  participantsMid:    number;
  participantsHigh:   number;
  programCostLow:     number;   // site currency — total prize liability
  programCostMid:     number;
  programCostHigh:    number;
  ggrUpliftMid:       number;   // gamification incremental GGR
  retentionValue:     number;
  totalValueMid:      number;   // ggrUplift + retention
  netResultMid:       number;   // totalValue − programCost
  costRatio:          number;   // programCostMid / (participantsMid × arpu)  (%)
  costPerActiveMid:   number;
  maxRisk:            number;   // programCostMid + one top-prize hit
  roi:                number;   // totalValueMid / programCostMid × 100
  breakEvenParticipants: number;
}

export function calcWheelEconomics(params: {
  region:      string;
  segment:     string;
  players:     number;
  avgDeposit:  number;          // site currency
  segments:    WheelSegment[];
  frequency:   WheelFrequency;
  sitecur?:    string;
  geo?:        string;
  betValue?:   number;          // site currency — nominal free-spin value
  wager?:      number;
  wcr?:        number;
  rtp?:        number;
}): WheelEconomics {
  const fxRate  = deriveLocalFxRate(params.sitecur ?? 'USD', params.geo);
  const arpu    = Math.round((ARPU_BY_REGION[params.region] ?? ARPU_BY_REGION['eu']) * fxRate * 100) / 100;

  const segmentRatio = SEGMENT_RATIO[params.segment] ?? 1.0;
  const eligible     = Math.round(params.players * segmentRatio);

  const rtp      = params.rtp ?? 0.96;
  const betValue = params.betValue ?? Math.max(0.1, Math.round(0.2 * fxRate * 100) / 100);
  const ctx: WheelCostContext = {
    avgDeposit: params.avgDeposit,
    betValue,
    wager: params.wager ?? 30,
    wcr:   params.wcr ?? 1.0,
    rtp,
  };

  const evPerSpin    = wheelExpectedValue(params.segments, ctx);
  const topPrizeCost = wheelTopPrizeCost(params.segments, ctx);

  const rates  = PARTICIPATION_RATES[params.frequency] ?? PARTICIPATION_RATES['daily'];
  const spins  = SPINS_PER_MONTH[params.frequency]     ?? SPINS_PER_MONTH['daily'];
  const engLift = ENGAGEMENT_LIFT[params.frequency]    ?? 0.10;
  const retLift = RETENTION_LIFT[params.segment]       ?? 0.06;

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

  // How many participants of incremental value are needed to cover program cost.
  const valuePerParticipant = arpu * (engLift + retLift);
  const breakEvenParticipants = valuePerParticipant > 0
    ? Math.ceil(programCostMid / valuePerParticipant)
    : 0;

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
