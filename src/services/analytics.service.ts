import { compareCampaign, type ForecastSnapshot, type CampaignActuals, type CampaignComparison } from '../domain/analytics/compareCampaign.js';
import { buildExplainPrompt } from '../ai/prompts/analysis-explain.prompt.js';
import { type AIProvider } from '../ai/interface.js';

export function analyzeCampaign(snap: ForecastSnapshot, act: CampaignActuals): CampaignComparison {
  return compareCampaign(snap, act);
}

export async function explainDivergence(comparison: CampaignComparison, ai: AIProvider): Promise<string> {
  return ai.generate(buildExplainPrompt(comparison), { maxTokens: 400 });
}
