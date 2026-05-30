import * as tournamentService              from '../services/tournament.service.js';
import { buildTournamentTextsPrompt }     from '../ai/prompts/tournament-texts.prompt.js';
import { buildTournamentAuditPrompt }     from '../ai/prompts/tournament-audit.prompt.js';
import { parseTournamentTextsResponse, parseTournamentAuditResponse } from '../ai/parser.js';
import type { TournamentGenerateInput, TournamentTextsInput, TournamentAuditInput } from '../validation/tournament.schema.js';
import type { AIProvider }                from '../ai/interface.js';

export function generateTournament(input: TournamentGenerateInput): ReturnType<typeof tournamentService.generateTournament> {
  return tournamentService.generateTournament({ type: input.type, params: input.params });
}

export async function generateTournamentTexts(input: TournamentTextsInput, ai: AIProvider): Promise<ReturnType<typeof parseTournamentTextsResponse>> {
  const { type, params, spec } = input;
  const prompt = buildTournamentTextsPrompt({
    type:   String(type   ?? 'slot'),
    params: (params as Record<string, unknown>) ?? {},
    spec:   (spec   as Record<string, unknown>) ?? {},
  });
  const raw = await ai.generate(prompt, { maxTokens: 4096 });
  return parseTournamentTextsResponse(raw);
}

export async function auditTournament(input: TournamentAuditInput, ai: AIProvider): Promise<ReturnType<typeof parseTournamentAuditResponse>> {
  const { type, params, spec, uiLang } = input;
  const prompt = buildTournamentAuditPrompt({
    type:   String(type   ?? 'slot'),
    params: (params as Record<string, unknown>) ?? {},
    spec:   (spec   as Record<string, unknown>) ?? {},
    uiLang: uiLang ? String(uiLang) : undefined,
  });
  const raw = await ai.generate(prompt, { maxTokens: 900 });
  return parseTournamentAuditResponse(raw);
}
