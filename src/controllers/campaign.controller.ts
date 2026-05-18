import { type Request, type Response, type NextFunction } from 'express';
import { buildTextsPrompt }              from '../ai/prompts/texts.prompt.js';
import { buildAuditPrompt }              from '../ai/prompts/audit.prompt.js';
import { generate as aiGenerate }        from '../ai/providers/anthropic.js';
import { parseTextsResponse, parseAuditResponse } from '../ai/parser.js';
import * as campaignService              from '../services/campaign.service.js';
import { AIProviderError }               from '../errors/AIProviderError.js';

export function generate(req: Request, res: Response, next: NextFunction): void {
  const { scenario, params } = req.body as { scenario?: Record<string, unknown>; params?: Record<string, unknown> };
  try {
    res.json(campaignService.generateCampaign({ scenario, params }));
  } catch (err) {
    next(err);
  }
}

export async function texts(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { scenario, mechanic, mechanicType, params } = req.body as Record<string, unknown>;
  try {
    const prompt = buildTextsPrompt({
      scenario: scenario as { lbl?: string } | null,
      mechanic: mechanic as Record<string, unknown> | null,
      mechanicType: mechanicType as string | undefined,
      params: params as { geo: string; lang?: string; tone?: string; segment?: string; lic?: string },
    });
    const raw = await aiGenerate(prompt, { maxTokens: 4096 });
    res.json(parseTextsResponse(raw));
  } catch (err) {
    next(err instanceof AIProviderError ? err : new AIProviderError((err instanceof Error ? err.message : String(err)) || 'AI generation failed'));
  }
}

export async function audit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { scenario, mechanic, mechanicType, params, uiLang } = req.body as Record<string, unknown>;
  try {
    const prompt = buildAuditPrompt({
      scenario: scenario as { lbl?: string } | null,
      mechanic: mechanic as Record<string, unknown> | null,
      mechanicType: mechanicType as string | undefined,
      uiLang: uiLang as string | undefined,
      params: params as { geo: string; lang?: string; segment?: string; risk?: string; lic?: string },
    });
    const raw = await aiGenerate(prompt, { maxTokens: 900 });
    res.json(parseAuditResponse(raw));
  } catch (err) {
    next(err instanceof AIProviderError ? err : new AIProviderError((err instanceof Error ? err.message : String(err)) || 'Audit failed'));
  }
}
