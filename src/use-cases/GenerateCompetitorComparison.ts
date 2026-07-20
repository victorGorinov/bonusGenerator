import { AI_SEARCH_MODEL }               from '../config/index.js';
import { buildCompetitorSearchPrompt }   from '../ai/prompts/competitor-search.prompt.js';
import { buildCompetitorComparePrompt }  from '../ai/prompts/competitor-compare.prompt.js';
import { parseCompetitorSearchResponse, parseCompetitorCompareResponse } from '../ai/parser.js';
import type { CompetitorSearchInput, CompetitorCompareInput } from '../validation/competitor.schema.js';
import type { AIProvider } from '../ai/interface.js';

// Live web-search for one competitor's public offer. Runs on the stronger
// AI_SEARCH_MODEL with server-side web search enabled. The prompt forbids
// fabrication: a miss returns found=false / confidence='unconfirmed' rather
// than invented numbers.
export async function searchCompetitorBonus(input: CompetitorSearchInput, ai: AIProvider) {
  const prompt = buildCompetitorSearchPrompt(input);
  // max_uses capped at 3: the real cost driver is web-search input tokens (each
  // search pulls page content into context — ~85k tokens at 5 uses), not output.
  // 3 searches finds a casino's headline bonus reliably at ~$0.20/call vs ~$0.38.
  const raw = await ai.generate(prompt, {
    model:     AI_SEARCH_MODEL,
    maxTokens: 1200,
    webSearch: { maxUses: 3 },
  });
  const parsed = parseCompetitorSearchResponse(raw);
  return {
    name:   input.casinoName,
    source: 'ai_search' as const,
    ...parsed,
  };
}

// Deterministic normalisation happens on the frontend / caller (params already
// keyed by promo-type param keys); this is a single no-web-search AI call for
// the verdict + recommendations, on the cheaper default model.
export async function compareCompetitorOffers(input: CompetitorCompareInput, ai: AIProvider) {
  const prompt = buildCompetitorComparePrompt(input);
  const raw = await ai.generate(prompt, { maxTokens: 1400 });
  return parseCompetitorCompareResponse(raw);
}
