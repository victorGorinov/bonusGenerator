import { GEO_CFG, LANG_NAME, SEG_DESC } from '../../domain/campaign/scenarios.js';
import { bonusLine } from '../../domain/ai/parser.js';
import { buildOfferTerms, type OfferTerm } from '../../domain/campaign/offerTerms.js';

interface DescriptionPromptParams {
  scenario?: { lbl?: string } | null;
  mechanic?: Record<string, unknown> | null;
  mechanicType?: string;
  uiLang?: string;
  params: { geo: string; lang?: string; tone?: string; segment?: string; lic?: string };
}

/**
 * Prompt for the customer-facing OFFER DESCRIPTION page (not a CRM message).
 * The exact terms are computed deterministically and passed in verbatim — the AI
 * writes the surrounding prose (title, hook, how-it-works, CTA) and must NOT invent
 * or change any numbers.
 */
export function buildDescriptionPrompt(
  { scenario, mechanic, mechanicType, uiLang, params }: DescriptionPromptParams,
): { prompt: string; terms: OfferTerm[] } {
  const geo         = GEO_CFG[params.geo] || GEO_CFG['de'];
  const resolvedLic = (params.lic && params.lic !== 'auto') ? params.lic : (geo.lic || 'none');
  const lic         = resolvedLic.toUpperCase();
  const lang        = LANG_NAME[params.lang ?? ''] || 'English';
  const seg         = SEG_DESC[params.segment ?? ''] || SEG_DESC['mid'];
  const bonus       = bonusLine(mechanic ?? null, mechanicType ?? '');
  const terms       = buildOfferTerms(mechanic, mechanicType, uiLang);

  const termsBlock = terms.length
    ? terms.map(term => `- ${term.label}: ${term.value}`).join('\n')
    : '- (no structured terms available)';

  const prompt = `You are a senior iGaming content writer. Write the copy for a customer-facing OFFER DESCRIPTION PAGE (the promotions/bonus detail page a player reads before opting in) — NOT a push notification or CRM message.

Offer context:
- Scenario: ${scenario?.lbl || 'Bonus offer'}
- Summary: ${bonus}
- Region: ${params.geo?.toUpperCase()} / License: ${lic}
- Audience: ${seg}
- Language: ${lang}

Exact offer terms (these are already displayed to the player as a separate table — DO NOT restate them as a list, DO NOT change any number, DO NOT invent extra terms):
${termsBlock}

Write informative, trustworthy page copy (not hard-sell CRM hype). Reference the offer's value naturally in prose. Keep it compliant: no guaranteed-win claims, no loss-recovery language.

Also write the full Terms & Conditions for this offer as a list of concise legal clauses. Base every numeric clause strictly on the exact offer terms above (do not invent numbers). Cover, where applicable: player eligibility (18+ / new or existing players), minimum deposit, wagering requirement and which balance it applies to, maximum bet while wagering, bonus validity period, game contribution/eligibility, max win/withdrawal cap, one-bonus-per-player/household, and a responsible-gambling line appropriate to the ${lic} license.

Return ONLY valid JSON, no markdown, no extra text:
{
  "title": "<offer page headline, 30-60 chars>",
  "hook": "<1-2 sentence intro paragraph, 120-220 chars>",
  "howItWorks": ["<step 1>", "<step 2>", "<step 3>"],
  "termsIntro": "<one sentence introducing the terms table below, e.g. 'Key terms at a glance:'>",
  "cta": "<call-to-action button text, max 24 chars>",
  "termsAndConditions": ["<clause 1>", "<clause 2>", "<clause 3>", "..."]
}
All copy in ${lang}. howItWorks: 3-5 short imperative steps describing how the player claims and uses the offer. termsAndConditions: 6-10 clear clauses.`;

  return { prompt, terms };
}
