import * as loyaltyService                 from '../services/loyalty.service.js';
import { buildLoyaltyTextsPrompt }         from '../ai/prompts/loyalty-texts.prompt.js';
import { buildLoyaltyAuditPrompt }         from '../ai/prompts/loyalty-audit.prompt.js';
import { buildLoyaltyOptimizePrompt }      from '../ai/prompts/loyalty-optimize.prompt.js';
import { buildLoyaltyMissionsPrompt }      from '../ai/prompts/loyalty-missions.prompt.js';
import { parseLoyaltyTextsResponse, parseLoyaltyAuditResponse, parseLoyaltyOptimizeResponse, parseLoyaltyMissionsResponse } from '../ai/parser.js';
import type { LoyaltyGenerateInput, LoyaltyRecalcInput, LoyaltyTextsInput, LoyaltyAuditInput, LoyaltyOptimizeInput, LoyaltyMissionsInput } from '../validation/loyalty.schema.js';
import type { AIProvider }                 from '../ai/interface.js';

export function generateLoyaltyConfig(input: LoyaltyGenerateInput) {
  return loyaltyService.generate(input);
}

export function recalcLoyaltyConfig(input: LoyaltyRecalcInput) {
  return loyaltyService.generate(input);
}

export async function generateLoyaltyTexts(input: LoyaltyTextsInput, ai: AIProvider): Promise<ReturnType<typeof parseLoyaltyTextsResponse>> {
  const prompt = buildLoyaltyTextsPrompt({ config: input.config, econ: input.econ, uiLang: input.uiLang });
  const raw    = await ai.generate(prompt, { maxTokens: 4096 });
  return parseLoyaltyTextsResponse(raw);
}

export async function auditLoyalty(input: LoyaltyAuditInput, ai: AIProvider): Promise<ReturnType<typeof parseLoyaltyAuditResponse>> {
  const prompt = buildLoyaltyAuditPrompt({ config: input.config, uiLang: input.uiLang });
  const raw    = await ai.generate(prompt, { maxTokens: 900 });
  return parseLoyaltyAuditResponse(raw);
}

export async function optimizeLoyalty(input: LoyaltyOptimizeInput, ai: AIProvider): Promise<ReturnType<typeof parseLoyaltyOptimizeResponse>> {
  const prompt = buildLoyaltyOptimizePrompt({ config: input.config, econ: input.econ, uiLang: input.uiLang });
  const raw    = await ai.generate(prompt, { maxTokens: 1000 });
  return parseLoyaltyOptimizeResponse(raw);
}

export async function generateLoyaltyMissions(input: LoyaltyMissionsInput, ai: AIProvider): Promise<ReturnType<typeof parseLoyaltyMissionsResponse>> {
  const prompt = buildLoyaltyMissionsPrompt({ config: input.config, econ: input.econ, uiLang: input.uiLang });
  const raw    = await ai.generate(prompt, { maxTokens: 600 });
  return parseLoyaltyMissionsResponse(raw);
}
