const ARPU_BY_REGION: Record<string, number> = {
  eu: 65, cis: 22, mn: 12, sweep: 30, crypto: 80, latam: 18,
};

const ELIGIBLE_BY_SEGMENT: Record<string, number> = {
  all: 5000, new: 1000, vip: 500, dormant: 2000, depositors: 3000,
};

const DURATION_DAYS: Record<string, number> = {
  flash: 0.03, daily: 1, weekly: 7, monthly: 30, multi_round: 10,
};

export interface TournamentEconomics {
  arpu:             number;
  eligible:         number;
  durationDays:     number;
  participantsLow:  number;
  participantsMid:  number;
  participantsHigh: number;
  ggrLiftLow:       number;
  ggrLiftMid:       number;
  ggrLiftHigh:      number;
  prizePoolCost:    number;
  netMarginLow:     number;
  netMarginMid:     number;
  netMarginHigh:    number;
  costPerActiveLow:  number;
  costPerActiveMid:  number;
  costPerActiveHigh: number;
  roi:              number;
  breakEvenParticipants: number;
}

export function calcTournamentEconomics(params: {
  region:      string;
  segment:     string;
  duration:    string;
  prizePool:   number;
  poolModel:   string;
  rake?:       number;
}): TournamentEconomics {
  const arpu         = ARPU_BY_REGION[params.region] ?? ARPU_BY_REGION['eu'];
  const eligible     = ELIGIBLE_BY_SEGMENT[params.segment] ?? 5000;
  const durationDays = DURATION_DAYS[params.duration] ?? 7;

  const participantsLow  = Math.round(eligible * 0.05);
  const participantsMid  = Math.round(eligible * 0.10);
  const participantsHigh = Math.round(eligible * 0.15);

  const revenuePerPlayerPerDay = arpu / 30;

  const ggrLiftLow  = Math.round(participantsLow  * revenuePerPlayerPerDay * durationDays * 0.20);
  const ggrLiftMid  = Math.round(participantsMid  * revenuePerPlayerPerDay * durationDays * 0.30);
  const ggrLiftHigh = Math.round(participantsHigh * revenuePerPlayerPerDay * durationDays * 0.40);

  const rake = params.rake ?? 0;
  let prizePoolCost: number;
  if      (params.poolModel === 'fixed')   prizePoolCost = params.prizePool;
  else if (params.poolModel === 'dynamic') prizePoolCost = params.prizePool * (1 - rake / 100);
  else                                     prizePoolCost = params.prizePool * 0.6; // hybrid

  prizePoolCost = Math.round(prizePoolCost);

  const netMarginLow  = ggrLiftLow  - prizePoolCost;
  const netMarginMid  = ggrLiftMid  - prizePoolCost;
  const netMarginHigh = ggrLiftHigh - prizePoolCost;

  const costPerActiveLow  = participantsLow  > 0 ? Math.round(prizePoolCost / participantsLow)  : 0;
  const costPerActiveMid  = participantsMid  > 0 ? Math.round(prizePoolCost / participantsMid)  : 0;
  const costPerActiveHigh = participantsHigh > 0 ? Math.round(prizePoolCost / participantsHigh) : 0;

  const roi = ggrLiftMid > 0 ? Math.round((netMarginMid / prizePoolCost) * 100) : 0;

  const breakEvenParticipants = revenuePerPlayerPerDay * durationDays * 0.30 > 0
    ? Math.ceil(prizePoolCost / (revenuePerPlayerPerDay * durationDays * 0.30))
    : 0;

  return {
    arpu, eligible, durationDays,
    participantsLow, participantsMid, participantsHigh,
    ggrLiftLow, ggrLiftMid, ggrLiftHigh,
    prizePoolCost,
    netMarginLow, netMarginMid, netMarginHigh,
    costPerActiveLow, costPerActiveMid, costPerActiveHigh,
    roi, breakEvenParticipants,
  };
}
