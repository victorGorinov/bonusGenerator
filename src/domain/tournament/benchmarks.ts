import { ARPU_BY_REGION } from './calcEconomics.js';

// Participation rates mirror PARTICIPATION_RATES in calcEconomics.ts.
const BENCH_PARTICIPATION: Record<string, { lo: number; mid: number; hi: number }> = {
  flash:       { lo: 0.03, mid: 0.07, hi: 0.12 },
  daily:       { lo: 0.05, mid: 0.10, hi: 0.18 },
  weekly:      { lo: 0.08, mid: 0.15, hi: 0.25 },
  monthly:     { lo: 0.10, mid: 0.18, hi: 0.30 },
  multi_round: { lo: 0.06, mid: 0.12, hi: 0.20 },
};

// Typical engagement multiplier mirrors ENGAGEMENT_LIFT in calcEconomics.ts.
const BENCH_ENGAGEMENT: Record<string, number> = {
  flash: 2.0, daily: 1.8, weekly: 2.5, monthly: 3.0, multi_round: 2.8,
};

// Retention lift per segment mirrors RETENTION_LIFT in calcEconomics.ts.
const BENCH_RETENTION: Record<string, number> = {
  all: 0.08, new: 0.15, vip: 0.05, dormant: 0.20, depositors: 0.10,
};

// Industry-typical ROI range for casino tournaments (% of prize pool invested).
// Sources: iGaming operator benchmarks (EveryMatrix, Enteractive) and internal calibration.
// Negative low = some break even or run at small loss; >150% = strongly optimistic signal.
const ROI_BENCHMARKS: Record<string, { lo: number; hi: number }> = {
  eu:     { lo: -20,  hi: 150 },
  cis:    { lo: -10,  hi: 200 },
  mn:     { lo: -20,  hi: 180 },
  sweep:  { lo: -30,  hi: 120 },
  crypto: { lo:  -5,  hi: 250 },
  latam:  { lo: -20,  hi: 160 },
};

// Normal cost-per-active-player range in USD.
// lo = generous prize spread across many players; hi = concentrated prize for few winners.
const COST_PER_ACTIVE_USD: Record<string, { lo: number; hi: number }> = {
  eu:     { lo: 0.50, hi: 25.0 },
  cis:    { lo: 0.10, hi: 10.0 },
  mn:     { lo: 0.05, hi:  5.0 },
  sweep:  { lo: 0.50, hi: 30.0 },
  crypto: { lo: 1.00, hi: 50.0 },
  latam:  { lo: 0.20, hi: 10.0 },
};

export interface TournamentBenchmarks {
  arpuUsd:       { lo: number; mid: number; hi: number };
  participation: { lo: number; mid: number; hi: number };
  engagement:    number;
  retentionLift: number;
  roi:           { lo: number; hi: number };
  costPerActive: { lo: number; hi: number };  // USD
}

export function tournamentBenchmarks({ region, segment, duration }: {
  region: string; segment: string; duration: string;
}): TournamentBenchmarks {
  const mid = ARPU_BY_REGION[region] ?? ARPU_BY_REGION['eu'];
  return {
    arpuUsd:       { lo: Math.round(mid * 0.6), mid, hi: Math.round(mid * 2) },
    participation: BENCH_PARTICIPATION[duration]  ?? BENCH_PARTICIPATION['weekly'],
    engagement:    BENCH_ENGAGEMENT[duration]     ?? 2.5,
    retentionLift: BENCH_RETENTION[segment]       ?? 0.08,
    roi:           ROI_BENCHMARKS[region]         ?? ROI_BENCHMARKS['eu'],
    costPerActive: COST_PER_ACTIVE_USD[region]    ?? COST_PER_ACTIVE_USD['eu'],
  };
}
