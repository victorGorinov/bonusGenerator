import { LANG_NAME } from '../../domain/campaign/scenarios.js';
import { COMPARE_PARAMS } from './competitor-params.js';
import type { CompetitorSearchInput } from '../../validation/competitor.schema.js';

const PROMO_LABEL: Record<CompetitorSearchInput['promoType'], string> = {
  bonus:      'welcome / deposit bonus',
  tournament: 'slot or casino tournament',
  loyalty:    'loyalty / VIP program',
  wheel:      'wheel-of-fortune / lucky-wheel promotion',
};

export function buildCompetitorSearchPrompt(input: CompetitorSearchInput): string {
  const { casinoName, region, promoType, uiLang } = input;
  const lang   = LANG_NAME[uiLang ?? ''] || 'English';
  const params = COMPARE_PARAMS[promoType];
  const paramLines = params.map((p) => `  "${p.key}": "<${p.hint}, or 'н/д' if not found>"`).join(',\n');

  return `You are a market-research assistant for an iGaming CRM tool. Use web search to find the CURRENT, publicly advertised ${PROMO_LABEL[promoType]} offered by the online casino "${casinoName}" for the ${region.toUpperCase()} market.

Search the operator's own site and reputable casino-review/aggregator pages. Prefer the operator's official promotions/terms page as the source.

CRITICAL RULES — accuracy over completeness:
- NEVER invent, guess, or estimate numbers. If you cannot find a reliable public source for this operator's current offer, return found=false, confidence="unconfirmed", sourceUrl=null, and set every param value to "н/д".
- If you find partial data, fill only the params you actually saw a source for; leave the rest "н/д".
- confidence="confirmed" ONLY when the values come from a clearly identifiable source (return its URL in sourceUrl). Otherwise "unconfirmed".
- Offers change often — report what the source shows now.

Return ONLY valid JSON, no markdown, in this exact shape (write "notes" in ${lang}):
{
  "found": true,
  "confidence": "confirmed",
  "sourceUrl": "https://... or null",
  "params": {
${paramLines}
  },
  "notes": "<one short caveat in ${lang}, e.g. what was/wasn't found; under 140 chars>"
}`;
}
