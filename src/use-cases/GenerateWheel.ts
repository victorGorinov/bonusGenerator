import * as wheelService            from '../services/wheel.service.js';
import { GEO_CFG }                   from '../domain/campaign/scenarios.js';
import { buildWheelTextsPrompt }     from '../ai/prompts/wheel-texts.prompt.js';
import { buildWheelAuditPrompt }     from '../ai/prompts/wheel-audit.prompt.js';
import { buildWheelOptimizePrompt }  from '../ai/prompts/wheel-optimize.prompt.js';
import { parseWheelTextsResponse, parseWheelAuditResponse, parseWheelOptimizeResponse } from '../ai/parser.js';
import type { WheelGenerateInput, WheelTextsInput, WheelAuditInput, WheelOptimizeInput } from '../validation/wheel.schema.js';
import type { AIProvider }           from '../ai/interface.js';

export function generateWheel(input: WheelGenerateInput): ReturnType<typeof wheelService.generateWheel> {
  return wheelService.generateWheel({ params: input.params });
}

export async function generateWheelTexts(input: WheelTextsInput, ai: AIProvider): Promise<ReturnType<typeof parseWheelTextsResponse>> {
  const prompt = buildWheelTextsPrompt({
    params: (input.params as Record<string, unknown>) ?? {},
    spec:   (input.spec   as Record<string, unknown>) ?? {},
  });
  const raw = await ai.generate(prompt, { maxTokens: 4096 });
  return parseWheelTextsResponse(raw);
}

export async function auditWheel(input: WheelAuditInput, ai: AIProvider): Promise<ReturnType<typeof parseWheelAuditResponse>> {
  const prompt = buildWheelAuditPrompt({
    params: (input.params as Record<string, unknown>) ?? {},
    spec:   (input.spec   as Record<string, unknown>) ?? {},
    uiLang: input.uiLang ? String(input.uiLang) : undefined,
  });
  const raw = await ai.generate(prompt, { maxTokens: 900 });
  return parseWheelAuditResponse(raw);
}

export async function optimizeWheel(input: WheelOptimizeInput, ai: AIProvider): Promise<ReturnType<typeof parseWheelOptimizeResponse>> {
  const geoCode = String(input.params['geo'] ?? 'de');
  const geoEntry = GEO_CFG[geoCode] ?? GEO_CFG['de'];
  const sitecur = input.params['currency'] ? String(input.params['currency']) : geoEntry.sitecur;
  const prompt = buildWheelOptimizePrompt({
    params: input.params,
    econ:   input.econ,
    region: geoEntry.region,
    cur:    sitecur,
    uiLang: input.uiLang,
  });
  const raw = await ai.generate(prompt, { maxTokens: 1000 });
  return parseWheelOptimizeResponse(raw);
}
