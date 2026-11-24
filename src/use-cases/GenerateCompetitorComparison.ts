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
  // max_uses capped at 2: the real cost driver is web-search input tokens (each
  // search pulls page content into context — ~100k tokens at 3 uses, ~$0.35 and
  // several minutes per call), not output. 2 searches still finds a casino's
  // headline offer, and the prompt tells the model to answer with what it has.
  // maxTokens 3000 (was 1200): the answer used to be truncated mid-JSON, which
  // surfaced as a 502 "AI returned malformed JSON" on every single call.
  // retries 1: a second attempt means another paid search — the failures we saw
  // were deterministic (truncation), not transient.
  const raw = await ai.generate(prompt, {
    model:     AI_SEARCH_MODEL,
    maxTokens: 3000,
    retries:   1,
    webSearch: { maxUses: 2 },
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
  // 2400, not 1400: the verdict carries a summary + strengths + weaknesses + up to
  // 6 recommendations for up to 3 competitors — 1400 truncated the JSON mid-object
  // and surfaced as a 502 "malformed JSON" whenever the payload was rich.
  const raw = await ai.generate(prompt, { maxTokens: 2400 });
  return parseCompetitorCompareResponse(raw);
}
