import { asyncHandler }                   from '../middleware/asyncHandler.js';
import { buildTournamentTextsPrompt }     from '../ai/prompts/tournament-texts.prompt.js';
import { buildTournamentAuditPrompt }     from '../ai/prompts/tournament-audit.prompt.js';
import { generate as aiGenerate }         from '../ai/providers/anthropic.js';
import { parseTournamentTextsResponse, parseTournamentAuditResponse } from '../ai/parser.js';
import * as tournamentService             from '../services/tournament.service.js';
import type { TournamentGenerateInput }   from '../validation/tournament.schema.js';
import type { TournamentTextsInput, TournamentAuditInput } from '../validation/tournament.schema.js';

export const generate = asyncHandler<Record<string, never>, unknown, TournamentGenerateInput>(
  async (req, res) => {
    const { type, params } = req.body;
    res.json(tournamentService.generateTournament({ type, params }));
  },
);

export const texts = asyncHandler<Record<string, never>, unknown, TournamentTextsInput>(
  async (req, res) => {
    const { type, params, spec } = req.body;
    const prompt = buildTournamentTextsPrompt({
      type:   String(type   ?? 'slot'),
      params: (params as Record<string, unknown>) ?? {},
      spec:   (spec   as Record<string, unknown>) ?? {},
    });
    const raw = await aiGenerate(prompt, { maxTokens: 4096 });
    res.json(parseTournamentTextsResponse(raw));
  },
);

export const audit = asyncHandler<Record<string, never>, unknown, TournamentAuditInput>(
  async (req, res) => {
    const { type, params, spec, uiLang } = req.body;
    const prompt = buildTournamentAuditPrompt({
      type:   String(type   ?? 'slot'),
      params: (params as Record<string, unknown>) ?? {},
      spec:   (spec   as Record<string, unknown>) ?? {},
      uiLang: uiLang ? String(uiLang) : undefined,
    });
    const raw = await aiGenerate(prompt, { maxTokens: 900 });
    res.json(parseTournamentAuditResponse(raw));
  },
);
