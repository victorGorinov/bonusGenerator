/**
 * Client-side port of src/domain/tournament/calcEconomics.ts
 * Keep in sync with the server implementation.
 */

const ARPU_BY_REGION = {
  eu: 65, cis: 22, mn: 12, sweep: 30, crypto: 80, latam: 18,
};

const STABLE_USD_TO_LOCAL = {
  USD: 1.00, USDT: 1.00, SC: 1.00,
  EUR: 0.92, GBP: 0.79,
  BTC: 0.000015, ETH: 0.00042,
};

// GEO_CFG subset — only geos that have avgdep+avgdepUSD set (mirrors scenarios.ts).
// FX rate = avgdep.mid / avgdepUSD.mid; geos without this pair fall back to STABLE_USD_TO_LOCAL.
const GEO_AVGDEP_USD = {
  dk: { avgdep: 700,    avgdepUSD: 95  },  // DKK: 700/95 ≈ 7.37
  ru: { avgdep: 5000,   avgdepUSD: 55  },  // RUB: 5000/55 ≈ 90.9
  kz: { avgdep: 20000,  avgdepUSD: 40  },  // KZT: 500
  mn: { avgdep: 100000, avgdepUSD: 29  },  // MNT: 100000/29 ≈ 3448
};

function deriveLocalFxRate(sitecur, geo) {
  if (geo) {
    const cfg = GEO_AVGDEP_USD[geo];
    if (cfg && cfg.avgdep && cfg.avgdepUSD) {
      return cfg.avgdep / cfg.avgdepUSD;
    }
  }
  return STABLE_USD_TO_LOCAL[sitecur] ?? 1;
}

const SEGMENT_RATIO = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

const DURATION_DAYS = {
  flash: 0.03, daily: 1, weekly: 7, monthly: 30, multi_round: 10,
};

const ENGAGEMENT_LIFT = {
  flash: 1.40, daily: 1.50, weekly: 1.80, monthly: 2.20, multi_round: 2.00,
};

const PARTICIPATION_RATES = {
  flash:       { low: 0.03, mid: 0.06, high: 0.10 },
  daily:       { low: 0.04, mid: 0.08, high: 0.15 },
  weekly:      { low: 0.06, mid: 0.11, high: 0.20 },
  monthly:     { low: 0.08, mid: 0.14, high: 0.25 },
  multi_round: { low: 0.05, mid: 0.10, high: 0.17 },
};

const RETENTION_LIFT = {
  all: 0.08, new: 0.15, vip: 0.05, dormant: 0.20, depositors: 0.10,
};

export function calcTournamentEconomics(params) {
  const fxRate       = deriveLocalFxRate(params.sitecur ?? 'USD', params.geo);
  const regionArpu   = ARPU_BY_REGION[params.region] ?? ARPU_BY_REGION['eu'];
  const arpu         = Math.round(regionArpu * fxRate * 100) / 100;
  const totalPlayers = params.totalPlayers ?? 5000;
  const segmentRatio = SEGMENT_RATIO[params.segment] ?? 1.0;
  const eligible     = Math.round(totalPlayers * segmentRatio);
  const durationDays = DURATION_DAYS[params.duration] ?? 7;

  const rates   = PARTICIPATION_RATES[params.duration]  ?? PARTICIPATION_RATES['weekly'];
  const engMul  = ENGAGEMENT_LIFT[params.duration]       ?? 2.5;
  const retLift = RETENTION_LIFT[params.segment]         ?? 0.08;

  const participantsLow  = Math.round(eligible * rates.low);
  const participantsMid  = Math.round(eligible * rates.mid);
  const participantsHigh = Math.round(eligible * rates.high);

  const revenuePerPlayerPerDay = arpu / 30;
  const incrementalMul = engMul - 1;
  const ggrLiftLow  = Math.round(participantsLow  * revenuePerPlayerPerDay * incrementalMul * durationDays);
  const ggrLiftMid  = Math.round(participantsMid  * revenuePerPlayerPerDay * incrementalMul * durationDays);
  const ggrLiftHigh = Math.round(participantsHigh * revenuePerPlayerPerDay * incrementalMul * durationDays);

  const retentionValue = Math.round(participantsMid * retLift * arpu);

  const rake = params.rake ?? 0;
  let prizePoolCost;
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

  const roi = prizePoolCost > 0 ? Math.round((totalValueMid / prizePoolCost) * 100) : 0;

  const ggrPerParticipantPerDay = revenuePerPlayerPerDay * incrementalMul;
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

/**
 * Recalc from draft.params — mirrors /api/tournament/generate econ output.
 * @param {object} params - draft.params object from tournament-generator.js
 * @returns {{ econ: TournamentEconomics }}
 */
export function recalcTournamentEconLocal(params) {
  const p = params;

  // Derive region from geo (mirrors GEO_CFG mapping in campaign/scenarios.ts)
  const GEO_TO_REGION = {
    de:'eu', fr:'eu', es:'eu', it:'eu', nl:'eu', dk:'eu', uk:'eu',
    ru:'cis', kz:'cis',
    mn:'mn',
    us:'sweep',
    mx:'latam', br:'latam',
  };
  const region = GEO_TO_REGION[p.geo] ?? 'eu';

  const GEO_TO_CUR = {
    de:'EUR', fr:'EUR', es:'EUR', it:'EUR', nl:'EUR',
    dk:'DKK', uk:'GBP',
    ru:'RUB', kz:'KZT', mn:'MNT',
    us:'USD', mx:'USD', br:'USD',
  };
  const sitecur = GEO_TO_CUR[p.geo] ?? 'USD';

  const econ = calcTournamentEconomics({
    region,
    segment:      p.segment      ?? 'all',
    duration:     p.duration     ?? 'weekly',
    prizePool:    p.prizePool    ?? 1000,
    poolModel:    p.poolModel    ?? 'fixed',
    rake:         p.rake         ?? 0,
    totalPlayers: p.totalPlayers ?? 5000,
    sitecur,
    geo: p.geo,
  });

  return { econ };
}

if (typeof window !== 'undefined') {
  window._tournamentEcon = { calcTournamentEconomics, recalcTournamentEconLocal };
}
