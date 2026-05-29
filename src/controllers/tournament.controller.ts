import { type Request, type Response, type NextFunction } from 'express';
import { buildTournamentTextsPrompt } from '../ai/prompts/tournament-texts.prompt.js';
import { buildTournamentAuditPrompt } from '../ai/prompts/tournament-audit.prompt.js';
import { generate as aiGenerate }     from '../ai/providers/anthropic.js';
import { parseTournamentTextsResponse, parseTournamentAuditResponse } from '../ai/parser.js';
import * as tournamentService         from '../services/tournament.service.js';
import { AIProviderError }            from '../errors/AIProviderError.js';

export function generate(req: Request, res: Response, next: NextFunction): void {
  const { type, params } = req.body as { type: string; params: Record<string, unknown> };
  try {
    res.json(tournamentService.generateTournament({ type, params }));
  } catch (err) {
    next(err);
  }
}

export async function texts(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { type, params, spec } = req.body as Record<string, unknown>;
  try {
    const prompt = buildTournamentTextsPrompt({
      type:   String(type   || 'slot'),
      params: (params as Record<string, unknown>) || {},
      spec:   (spec   as Record<string, unknown>) || {},
    });
    const raw = await aiGenerate(prompt, { maxTokens: 4096 });
    res.json(parseTournamentTextsResponse(raw));
  } catch (err) {
    next(err instanceof AIProviderError ? err : new AIProviderError((err instanceof Error ? err.message : String(err)) || 'AI generation failed'));
  }
}

export async function audit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { type, params, spec, uiLang } = req.body as Record<string, unknown>;
  try {
    const prompt = buildTournamentAuditPrompt({
      type:    String(type   || 'slot'),
      params:  (params  as Record<string, unknown>) || {},
      spec:    (spec    as Record<string, unknown>) || {},
      uiLang:  uiLang ? String(uiLang) : undefined,
    });
    const raw = await aiGenerate(prompt, { maxTokens: 900 });
    res.json(parseTournamentAuditResponse(raw));
  } catch (err) {
    next(err instanceof AIProviderError ? err : new AIProviderError((err instanceof Error ? err.message : String(err)) || 'Audit failed'));
  }
}
