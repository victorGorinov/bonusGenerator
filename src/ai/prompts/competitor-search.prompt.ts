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
  const paramLines = params.map((p) => `  "${p.key}": "<${p.hint}, or "" if not found>"`).join(',\n');

  return `Find the CURRENT, publicly advertised ${PROMO_LABEL[promoType]} of the online casino "${casinoName}" for the ${region.toUpperCase()} market. Prefer the operator's own promotions/terms page; a reputable casino-review page is acceptable.

RULES:
- Run AT MOST 2 web searches, then answer with what you have. Do not keep searching for missing fields.
- NEVER invent, guess or estimate a number. Unfound fields are "" (empty string) — that is the expected outcome, not a failure.
- No source at all → found=false, confidence="unconfirmed", sourceUrl=null, every param "".
- confidence="confirmed" only when the values come from one clearly identifiable page (put its URL in sourceUrl).

OUTPUT: raw JSON only — no markdown fences, no commentary, no citations, nothing before or after the object. Keep it short; it must fit well within the token limit.
{
  "found": true,
  "confidence": "confirmed",
  "sourceUrl": "https://... or null",
  "params": {
${paramLines}
  },
  "notes": "<one caveat in ${lang}, under 100 chars>"
}`;
}
