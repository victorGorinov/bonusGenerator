import * as campaignService              from '../services/campaign.service.js';
import { buildTextsPrompt }              from '../ai/prompts/texts.prompt.js';
import { buildAuditPrompt }              from '../ai/prompts/audit.prompt.js';
import { buildOptimizePrompt }           from '../ai/prompts/optimize.prompt.js';
import { parseTextsResponse, parseAuditResponse, parseOptimizeResponse } from '../ai/parser.js';
import type { CampaignGenerateInput }    from '../validation/campaign.schema.js';
import type { TextsInput }               from '../validation/texts.schema.js';
import type { AuditInput }               from '../validation/audit.schema.js';
import type { OptimizeInput }            from '../validation/optimize.schema.js';
import type { AIProvider }               from '../ai/interface.js';

export function generateCampaign(input: CampaignGenerateInput): ReturnType<typeof campaignService.generateCampaign> {
  const { scenario, params } = input;
  return campaignService.generateCampaign({ scenario, params });
}

export async function generateCampaignTexts(input: TextsInput, ai: AIProvider): Promise<ReturnType<typeof parseTextsResponse>> {
  const { scenario, mechanic, mechanicType, params } = input;
  const prompt = buildTextsPrompt({ scenario, mechanic, mechanicType, params });
  const raw = await ai.generate(prompt, { maxTokens: 4096 });
  return parseTextsResponse(raw);
}

export async function auditCampaign(input: AuditInput, ai: AIProvider): Promise<ReturnType<typeof parseAuditResponse>> {
  const { scenario, mechanic, mechanicType, uiLang, params } = input;
  const prompt = buildAuditPrompt({ scenario, mechanic, mechanicType, uiLang, params });
  const raw = await ai.generate(prompt, { maxTokens: 900 });
  return parseAuditResponse(raw);
}

export async function optimizeCampaign(input: OptimizeInput, ai: AIProvider): Promise<ReturnType<typeof parseOptimizeResponse>> {
  const prompt = buildOptimizePrompt(input);
  const raw = await ai.generate(prompt, { maxTokens: 1000 });
  return parseOptimizeResponse(raw);
}
