import type { CampaignComparison } from '../../domain/analytics/compareCampaign.js';

export function buildExplainPrompt(c: CampaignComparison): string {
  const costDeviation = c.costVariancePct >= 0 ? 'higher' : 'lower';
  const roi = c.roiActual >= 0
    ? `positive (${c.roiActual.toFixed(0)}%)`
    : `negative (${c.roiActual.toFixed(0)}%)`;
  const flags = c.flags.length > 0 ? `Flags: ${c.flags.join(', ')}` : 'No risk flags';

  return `Briefly explain why this campaign's actual bonus cost diverged from forecast (1–2 sentences max):

Forecast: P50 cost ${c.forecastCostP50.toFixed(0)}, P10–P90 band, cost ratio ${c.forecastRatio.toFixed(3)}, forecast net ${c.forecastNet.toFixed(0)} USD
Actual: cost ${c.actualCost.toFixed(0)} (${costDeviation} by ${Math.abs(c.costVariancePct).toFixed(1)}%), wager completion ${c.actualWagerCompl.toFixed(0)}%, cost ratio ${c.actualRatio.toFixed(3)}, actual ROI ${roi}, net ${c.actualNet.toFixed(0)} USD
Percentile: ${c.percentile}. ${flags}

Why did actual diverge from forecast? Focus on the cost difference and any risk flags.`;
}
