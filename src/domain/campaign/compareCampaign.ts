export interface ForecastSnapshot {
  sP50: { cost: number; conv: number };
  costRatio: number;
  pl: number;
  arpu: number;
  ltv3: number;
  capturedAt: string;
}

export interface ActualData {
  cost:        number;  // actual campaign cost — must be in the same currency as forecastSnapshot.sP50.cost (sitecur)
  activations: number;  // players who received bonus
  conversions: number;  // players who completed wagering
  revenue3m:   number;  // actual 3-month incremental revenue in USD (matches ltv3 benchmark currency)
}

export interface CampaignComparison {
  forecastCost:   number;
  actualCost:     number;
  costVariance:   number;   // actual - forecast (negative = under budget)
  costVariancePct: number;  // %

  forecastConv:   number;   // 0–1
  actualConv:     number;   // conversions / activations
  convVariance:   number;

  forecastRev:    number;   // USD
  actualRev:      number;   // USD
  revVariance:    number;
  revVariancePct: number;

  // NOTE: ROI mixes cost (sitecur) and revenue (USD). Only meaningful for USD/EUR geos
  // where the difference is negligible. For RUB/KZT/MNT treat as directional only.
  forecastRoi:    number;   // (forecastRev_usd - forecastCost_sitecur) / forecastCost_sitecur
  actualRoi:      number;

  accuracy: 'good' | 'ok' | 'poor';  // classified by |costVariancePct|: <15% good, <30% ok
}

export function compareCampaign(
  forecast: ForecastSnapshot,
  actual: ActualData,
): CampaignComparison {
  const forecastCost = forecast.sP50.cost;
  const forecastConv = forecast.sP50.conv;
  const forecastRev  = Math.round(forecast.pl * forecastConv * forecast.ltv3);

  const actualConv   = actual.activations > 0 ? actual.conversions / actual.activations : 0;
  const costVar      = actual.cost - forecastCost;
  const costVarPct   = forecastCost > 0 ? (costVar / forecastCost) * 100 : 0;
  const revVar       = actual.revenue3m - forecastRev;
  const revVarPct    = forecastRev > 0 ? (revVar / forecastRev) * 100 : 0;

  const forecastRoi  = forecastCost > 0 ? (forecastRev - forecastCost) / forecastCost : 0;
  const actualRoi    = actual.cost > 0  ? (actual.revenue3m - actual.cost) / actual.cost : 0;

  const absCostPct = Math.abs(costVarPct);
  const accuracy: CampaignComparison['accuracy'] =
    absCostPct < 15 ? 'good' : absCostPct < 30 ? 'ok' : 'poor';

  return {
    forecastCost, actualCost: actual.cost,
    costVariance: costVar, costVariancePct: costVarPct,
    forecastConv, actualConv, convVariance: actualConv - forecastConv,
    forecastRev, actualRev: actual.revenue3m, revVariance: revVar, revVariancePct: revVarPct,
    forecastRoi, actualRoi,
    accuracy,
  };
}
