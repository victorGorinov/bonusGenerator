import { buildLoyaltyTerms } from '../../domain/loyalty/offerTerms.js';
import type { OfferTerm } from '../../domain/campaign/offerTerms.js';

interface LoyaltyDescriptionParams {
  config: Record<string, unknown>;
  uiLang?: string;
}

function langName(code: string): string {
  const MAP: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', es: 'Spanish' };
  return MAP[code] || 'English';
}

/**
 * Prompt for the customer-facing LOYALTY PROGRAM description page (not a CRM message).
 * Exact terms are computed deterministically and passed in verbatim; the AI writes
 * the surrounding prose + full Terms & Conditions and must NOT invent numbers.
 */
export function buildLoyaltyDescriptionPrompt(
  { config, uiLang }: LoyaltyDescriptionParams,
): { prompt: string; terms: OfferTerm[] } {
  const region = String(config['region'] ?? 'eu');
  const lang   = langName(uiLang || 'en');
  const terms  = buildLoyaltyTerms(config, uiLang);

  const termsBlock = terms.length
    ? terms.map(term => `- ${term.label}: ${term.value}`).join('\n')
    : '- (no structured terms available)';

  const prompt = `You are a senior iGaming content writer. Write the copy for a customer-facing LOYALTY PROGRAM DESCRIPTION PAGE (the page a player reads to understand the rewards program) — NOT a push notification or CRM message.

Program context:
- Region: ${region.toUpperCase()}
- Language: ${lang}

Exact program terms (already displayed to the player as a separate table — DO NOT restate them as a list, DO NOT change any number, DO NOT invent extra terms):
${termsBlock}

Write informative, trustworthy page copy that explains the value of joining and progressing through the program. Keep it compliant: no guaranteed-win claims.

Also write the full Terms & Conditions for this loyalty program as a list of concise legal clauses. Base every numeric clause strictly on the exact terms above (do not invent numbers). Cover, where applicable: eligibility (18+, active account), how points are earned (deposit/wager), how points are redeemed and the minimum, tier qualification and any downgrade rules, top-tier cashback conditions, points expiry, mission rules if present, and a responsible-gambling line.

Return ONLY valid JSON, no markdown, no extra text:
{
  "title": "<program page headline, 30-60 chars>",
  "hook": "<1-2 sentence intro paragraph, 120-220 chars>",
  "howItWorks": ["<step 1>", "<step 2>", "<step 3>"],
  "termsIntro": "<one sentence introducing the terms table, e.g. 'Program at a glance:'>",
  "cta": "<call-to-action button text, max 24 chars>",
  "termsAndConditions": ["<clause 1>", "<clause 2>", "<clause 3>", "..."]
}
All copy in ${lang}. howItWorks: 3-5 short imperative steps on how to join, earn and redeem. termsAndConditions: 6-10 clear clauses.`;

  return { prompt, terms };
}
