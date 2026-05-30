import { asyncHandler }                  from '../middleware/asyncHandler.js';
import { buildTextsPrompt }              from '../ai/prompts/texts.prompt.js';
import { buildAuditPrompt }              from '../ai/prompts/audit.prompt.js';
import { buildOptimizePrompt }           from '../ai/prompts/optimize.prompt.js';
import { generate as aiGenerate }        from '../ai/providers/anthropic.js';
import { parseTextsResponse, parseAuditResponse, parseOptimizeResponse } from '../ai/parser.js';
import * as campaignService              from '../services/campaign.service.js';
import { AIProviderError }               from '../errors/AIProviderError.js';
import type { CampaignGenerateInput }    from '../validation/campaign.schema.js';
import type { TextsInput }               from '../validation/texts.schema.js';
import type { AuditInput }               from '../validation/audit.schema.js';
import type { OptimizeInput }            from '../validation/optimize.schema.js';

export const generate = asyncHandler<Record<string, never>, unknown, CampaignGenerateInput>(
  async (req, res) => {
    const { scenario, params } = req.body;
    res.json(campaignService.generateCampaign({ scenario, params }));
  },
);

export const texts = asyncHandler<Record<string, never>, unknown, TextsInput>(
  async (req, res) => {
    const { scenario, mechanic, mechanicType, params } = req.body;
    const prompt = buildTextsPrompt({ scenario, mechanic, mechanicType, params });
    const raw = await aiGenerate(prompt, { maxTokens: 4096 });
    res.json(parseTextsResponse(raw));
  },
);

export const audit = asyncHandler<Record<string, never>, unknown, AuditInput>(
  async (req, res) => {
    const { scenario, mechanic, mechanicType, uiLang, params } = req.body;
    const prompt = buildAuditPrompt({ scenario, mechanic, mechanicType, uiLang, params });
    const raw = await aiGenerate(prompt, { maxTokens: 900 });
    res.json(parseAuditResponse(raw));
  },
);

export const optimize = asyncHandler<Record<string, never>, unknown, OptimizeInput>(
  async (req, res) => {
    const prompt = buildOptimizePrompt(req.body);
    const raw = await aiGenerate(prompt, { maxTokens: 1000 });
    res.json(parseOptimizeResponse(raw));
  },
);
