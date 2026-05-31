import { compareCampaign, type ForecastSnapshot, type CampaignActuals, type CampaignComparison } from '../domain/analytics/compareCampaign.js';

export function analyzeCampaign(snap: ForecastSnapshot, act: CampaignActuals): CampaignComparison {
  return compareCampaign(snap, act);
}
