import * as tournamentService              from '../services/tournament.service.js';
import { buildTournamentTextsPrompt }     from '../ai/prompts/tournament-texts.prompt.js';
import { buildTournamentAuditPrompt }     from '../ai/prompts/tournament-audit.prompt.js';
import { buildGamesPrompt }               from '../ai/prompts/tournament-games.prompt.js';
import { buildTournamentOptimizePrompt }  from '../ai/prompts/tournament-optimize.prompt.js';
import { parseTournamentTextsResponse, parseTournamentAuditResponse, parseGamesResponse, parseTournamentOptimizeResponse } from '../ai/parser.js';
import { recommendGames }                 from '../domain/games/recommendGames.js';
import { tournamentBenchmarks }           from '../domain/tournament/benchmarks.js';
import { GEO_CFG }                        from '../domain/campaign/scenarios.js';
import type { TournamentGenerateInput, TournamentTextsInput, TournamentAuditInput, TournamentGamesInput, TournamentOptimizeInput } from '../validation/tournament.schema.js';
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

export async function recommendTournamentGames(input: TournamentGamesInput, ai: AIProvider) {
  const { geo, segment, type, scoring, plat, uiLang } = input;
  const region = GEO_CFG[geo]?.region ?? geo;

  // Deterministic pool — no AI, always fast
  const { primary, alternatives, scores } = recommendGames({ geo, region, segment, type, scoring, plat });

  // AI rationale — degrades gracefully if AI fails
  let rationale: string | null = null;
  let gameAnnotations: { id: string; why: string }[] = [];

  if (primary.length > 0) {
    try {
      const prompt = buildGamesPrompt({ region, geo, segment, type, scoring, primary, lang: uiLang });
      const raw = await ai.generate(prompt, { maxTokens: 600 });
      const parsed = parseGamesResponse(raw);
      rationale = parsed.rationale;
      gameAnnotations = parsed.games;
    } catch {
      // AI failure is non-fatal — return unannotated pool
    }
  }

  // Merge annotations into primary games
  const annotatedPrimary = primary.map(g => {
    const annotation = gameAnnotations.find(a => a.id === g.id);
    return { ...g, why: annotation?.why ?? null };
  });

  return { primary: annotatedPrimary, alternatives, scores, rationale, region };
}

export async function optimizeTournament(input: TournamentOptimizeInput, ai: AIProvider): Promise<ReturnType<typeof parseTournamentOptimizeResponse>> {
  const geoCode = String(input.params['geo'] ?? 'de');
  const geoEntry = GEO_CFG[geoCode] ?? GEO_CFG['de'];
  const region  = geoEntry.region;
  const sitecur = input.params['currency'] ? String(input.params['currency']) : geoEntry.sitecur;
  const benchmarks = tournamentBenchmarks({
    region,
    segment:  String(input.params['segment']  ?? 'all'),
    duration: String(input.params['duration'] ?? 'weekly'),
  });
  const prompt = buildTournamentOptimizePrompt({
    ...input,
    benchmarks,
    region,
    cur: sitecur,
    uiLang: input.uiLang,
  });
  const raw = await ai.generate(prompt, { maxTokens: 1200 });
  return parseTournamentOptimizeResponse(raw);
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
