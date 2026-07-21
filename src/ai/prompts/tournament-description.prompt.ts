import { GEO_CFG, LANG_NAME } from '../../domain/campaign/scenarios.js';
import { buildTournamentTerms } from '../../domain/tournament/offerTerms.js';
import type { OfferTerm } from '../../domain/campaign/offerTerms.js';

interface TournamentDescriptionParams {
  type:   string;
  params: Record<string, unknown>;
  spec:   Record<string, unknown>;
  uiLang?: string;
}

/**
 * Prompt for the customer-facing TOURNAMENT description page (not a CRM message).
 * Exact terms are computed deterministically and passed in verbatim; the AI writes
 * the surrounding prose + full Terms & Conditions and must NOT invent numbers.
 */
export function buildTournamentDescriptionPrompt(
  { type, params, spec, uiLang }: TournamentDescriptionParams,
): { prompt: string; terms: OfferTerm[] } {
  const geo         = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto') ? String(params['lic']) : (geo.lic || 'none');
  const lic         = resolvedLic.toUpperCase();
  const lang        = LANG_NAME[String(params['lang'] || 'en')] || 'English';
  const terms       = buildTournamentTerms(type, params, spec, uiLang);

  const termsBlock = terms.length
    ? terms.map(term => `- ${term.label}: ${term.value}`).join('\n')
    : '- (no structured terms available)';

  const prompt = `You are a senior iGaming content writer. Write the copy for a customer-facing TOURNAMENT DESCRIPTION PAGE (the promotions page a player reads before joining the tournament) — NOT a push notification or CRM message.

Tournament context:
- Region: ${String(params['geo'] || 'de').toUpperCase()} / License: ${lic}
- Language: ${lang}

Exact tournament terms (already displayed to the player as a separate table — DO NOT restate them as a list, DO NOT change any number, DO NOT invent extra terms):
${termsBlock}

Write informative, exciting-but-trustworthy page copy (competition-driven, not misleading). Reference the prize pool and ranking mechanism naturally. Keep it compliant: no guaranteed-win claims.

Also write the full Terms & Conditions for this tournament as a list of concise legal clauses. Base every numeric/structural clause strictly on the exact terms above (do not invent numbers). Cover, where applicable: player eligibility (18+ / segment), entry method and any buy-in/re-entry rules, tournament period, how ranking/scoring works, prize distribution and how prizes are credited (and any wagering on prizes), fair-play / anti-collusion, one-account-per-player, and a responsible-gambling line appropriate to the ${lic} license.

Return ONLY valid JSON, no markdown, no extra text:
{
  "title": "<tournament page headline, 30-60 chars>",
  "hook": "<1-2 sentence intro paragraph, 120-220 chars>",
  "howItWorks": ["<step 1>", "<step 2>", "<step 3>"],
  "termsIntro": "<one sentence introducing the terms table, e.g. 'Tournament at a glance:'>",
  "cta": "<call-to-action button text, max 24 chars>",
  "termsAndConditions": ["<clause 1>", "<clause 2>", "<clause 3>", "..."]
}
All copy in ${lang}. howItWorks: 3-5 short imperative steps on how to join and compete. termsAndConditions: 6-10 clear clauses.`;

  return { prompt, terms };
}
