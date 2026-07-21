import { GEO_CFG, LANG_NAME } from '../../domain/campaign/scenarios.js';
import { buildWheelTerms } from '../../domain/wheel/offerTerms.js';
import type { OfferTerm } from '../../domain/campaign/offerTerms.js';

interface WheelDescriptionParams {
  params: Record<string, unknown>;
  spec:   Record<string, unknown>;
  uiLang?: string;
}

/**
 * Prompt for the customer-facing WHEEL OF FORTUNE description page (not a CRM message).
 * Exact terms are computed deterministically and passed in verbatim; the AI writes
 * the surrounding prose + full Terms & Conditions and must NOT invent numbers.
 */
export function buildWheelDescriptionPrompt(
  { params, spec, uiLang }: WheelDescriptionParams,
): { prompt: string; terms: OfferTerm[] } {
  const geo         = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto') ? String(params['lic']) : (geo.lic || 'none');
  const lic         = resolvedLic.toUpperCase();
  const lang        = LANG_NAME[String(params['lang'] || 'en')] || 'English';
  const terms       = buildWheelTerms(params, spec, uiLang);

  const termsBlock = terms.length
    ? terms.map(term => `- ${term.label}: ${term.value}`).join('\n')
    : '- (no structured terms available)';

  const prompt = `You are a senior iGaming content writer. Write the copy for a customer-facing WHEEL OF FORTUNE DESCRIPTION PAGE (the promotions page a player reads before spinning) — NOT a push notification or CRM message.

Wheel context:
- Region: ${String(params['geo'] || 'de').toUpperCase()} / License: ${lic}
- Language: ${lang}

Exact wheel terms (already displayed to the player as a separate table — DO NOT restate them as a list, DO NOT change any number, DO NOT invent extra prizes):
${termsBlock}

Write informative, exciting-but-trustworthy page copy about the spin experience and the prizes on offer. Keep it compliant: NO guaranteed-win claims, make clear outcomes are random.

Also write the full Terms & Conditions for this wheel as a list of concise legal clauses. Base every clause strictly on the exact terms above (do not invent numbers/prizes). Cover, where applicable: eligibility (18+ / segment), how a spin is earned (cadence), that prizes are awarded at random, any wagering on prizes won, prize crediting, one-spin-per-qualification rules, and a responsible-gambling line appropriate to the ${lic} license.

Return ONLY valid JSON, no markdown, no extra text:
{
  "title": "<wheel page headline, 30-60 chars>",
  "hook": "<1-2 sentence intro paragraph, 120-220 chars>",
  "howItWorks": ["<step 1>", "<step 2>", "<step 3>"],
  "termsIntro": "<one sentence introducing the terms table, e.g. 'Wheel at a glance:'>",
  "cta": "<call-to-action button text, max 24 chars>",
  "termsAndConditions": ["<clause 1>", "<clause 2>", "<clause 3>", "..."]
}
All copy in ${lang}. howItWorks: 3-5 short imperative steps on how to earn and use a spin. termsAndConditions: 6-10 clear clauses.`;

  return { prompt, terms };
}
