import { parseAI }                  from '../domain/ai/parser.js';
import { buildTextsPrompt }         from '../ai/prompts/texts.prompt.js';
import { buildAuditPrompt }         from '../ai/prompts/audit.prompt.js';
import { generate as aiGenerate }   from '../ai/providers/anthropic.js';
import * as campaignService         from '../services/campaign.service.js';
import { AIProviderError }          from '../errors/AIProviderError.js';

export function generate(req, res, next) {
  const { scenario, params } = req.body;   // validated by CampaignGenerateSchema
  try {
    res.json(campaignService.generateCampaign({ scenario, params }));
  } catch (err) {
    next(err);
  }
}

export async function texts(req, res, next) {
  const { scenario, mechanic, mechanicType, params } = req.body;
  try {
    const prompt = buildTextsPrompt({ scenario, mechanic, mechanicType, params });
    const text   = await aiGenerate(prompt, { maxTokens: 4096 });
    res.json(parseAI(text));
  } catch (err) {
    next(err instanceof AIProviderError ? err : new AIProviderError(err.message || 'AI generation failed'));
  }
}

export async function audit(req, res, next) {
  const { scenario, mechanic, mechanicType, params, uiLang } = req.body;
  try {
    const prompt = buildAuditPrompt({ scenario, mechanic, mechanicType, params, uiLang });
    const text   = await aiGenerate(prompt, { maxTokens: 900 });
    res.json(parseAI(text));
  } catch (err) {
    next(err instanceof AIProviderError ? err : new AIProviderError(err.message || 'Audit failed'));
  }
}
