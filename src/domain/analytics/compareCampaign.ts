// Campaign forecast vs actual comparison — pure domain logic
// No side effects; mirrors recalcCosts / calcEconomics discipline

export interface ForecastSnapshot {
  capturedAt: string;   // ISO timestamp
  geo: string;
  segment: 'new' | 'mid' | 'vip';
  lic: string;
  cur: string;          // sitecur
  pl: number;           // player count in forecast
  costRatio: number;    // econ.costRatio (P50)
  sP10: number;         // econ.sP10.cost (total, sitecur)
  sP50: number;         // econ.sP50.cost
  sP90: number;         // econ.sP90.cost
  conv: { p10: number; p50: number; p90: number };  // wager completion rates
  lift: number;         // incremental lift (0–0.40)
  incrPl: number;       // forecast incremental players
  incrRev: number;      // USD
  campCost3: number;    // USD, 3-month cost
  net: number;          // USD, incrRev − campCost3
}

export interface CampaignActuals {
  enteredAt: string;    // ISO timestamp
  source: 'manual' | 'csv' | 'api';
  participants: number; // real players who took bonus
  totalDeposits: number;    // sitecur
  wagerCompleted: number;   // 0–1, fraction of players
  bonusPayout: number;      // sitecur, real total cost
  incrPlayers?: number;     // optional, default 0
  incrRevenue?: number;     // optional, USD
  notes?: string;
}

export interface CampaignComparison {
  // Cost accuracy (sitecur)
  forecastCostP50: number;
  actualCost: number;
  costVarianceAbs: number;
  costVariancePct: number;
  percentile: 'below_p10' | 'p10_p50' | 'p50_p90' | 'above_p90';
  withinBand: boolean;

  // Behaviour accuracy (wager completion)
  forecastConvP50: number;
  actualWagerCompl: number;
  convVariancePct: number;

  // Cost ratio
  forecastRatio: number;
  actualRatio: number;
  ratioVariancePct: number;

  // ROI (USD only)
  forecastNet: number;
  actualNet: number;
  netVarianceAbs: number;
  roiActual: number;

  // Risk flags
  flags: Array<'worse_than_worst_case' | 'better_than_best_case' | 'abuse_suspected' | 'data_incomplete'>;
}

export function compareCampaign(snap: ForecastSnapshot, act: CampaignActuals): CampaignComparison {
  const forecastCostP50 = snap.sP50;
  const actualCost = act.bonusPayout;
  const costVarianceAbs = actualCost - forecastCostP50;
  const costVariancePct = forecastCostP50 !== 0 ? (costVarianceAbs / forecastCostP50) * 100 : 0;

  // Percentile classification
  let percentile: 'below_p10' | 'p10_p50' | 'p50_p90' | 'above_p90';
  if (actualCost < snap.sP10) {
    percentile = 'below_p10';
  } else if (actualCost <= snap.sP50) {
    percentile = 'p10_p50';
  } else if (actualCost <= snap.sP90) {
    percentile = 'p50_p90';
  } else {
    percentile = 'above_p90';
  }

  const withinBand = actualCost >= snap.sP10 && actualCost <= snap.sP90;

  // Behaviour accuracy
  const forecastConvP50 = snap.conv.p50;
  const actualWagerCompl = act.wagerCompleted;
  const convVariancePct = forecastConvP50 !== 0 ? ((actualWagerCompl - forecastConvP50) / forecastConvP50) * 100 : 0;

  // Cost ratio (guard division by zero)
  const forecastRatio = snap.costRatio;
  const actualRatio = act.totalDeposits !== 0 ? act.bonusPayout / act.totalDeposits : 0;
  const ratioVariancePct = forecastRatio !== 0 ? ((actualRatio - forecastRatio) / forecastRatio) * 100 : 0;

  // ROI (USD only; forecast.net already in USD)
  const forecastNet = snap.net;
  const incrRevenue = act.incrRevenue ?? 0;
  // Note: campCost3 is USD in forecast; for actual we assume same 3-month period
  // In real usage, operator would pass actual campaign cost or we'd derive from dates
  const campaignCostUSD = snap.campCost3; // Use forecast cost as baseline; Phase 2 can make this dynamic
  const actualNet = incrRevenue - campaignCostUSD;
  const netVarianceAbs = actualNet - forecastNet;
  const roiActual = campaignCostUSD !== 0 ? (actualNet / campaignCostUSD) * 100 : 0;

  // Risk flags
  const flags: CampaignComparison['flags'] = [];

  // Worse than worst case
  if (actualCost > snap.sP90) {
    flags.push('worse_than_worst_case');
  }

  // Better than best case
  if (actualCost < snap.sP10) {
    flags.push('better_than_best_case');
  }

  // Abuse suspected: very low wager completion + high cost ratio
  if (
    actualWagerCompl < 0.5 * forecastConvP50 &&
    actualRatio > forecastRatio * 1.2 // actual ratio 20%+ higher
  ) {
    flags.push('abuse_suspected');
  }

  // Data incomplete
  if (
    act.participants === 0 ||
    act.totalDeposits === 0 ||
    act.wagerCompleted === 0 ||
    act.bonusPayout === 0
  ) {
    flags.push('data_incomplete');
  }

  return {
    forecastCostP50,
    actualCost,
    costVarianceAbs,
    costVariancePct,
    percentile,
    withinBand,

    forecastConvP50,
    actualWagerCompl,
    convVariancePct,

    forecastRatio,
    actualRatio,
    ratioVariancePct,

    forecastNet,
    actualNet,
    netVarianceAbs,
    roiActual,

    flags,
  };
}
