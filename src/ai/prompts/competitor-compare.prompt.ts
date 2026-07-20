import { LANG_NAME } from '../../domain/campaign/scenarios.js';
import { COMPARE_PARAMS } from './competitor-params.js';
import type { CompetitorCompareInput } from '../../validation/competitor.schema.js';

const PROMO_LABEL: Record<CompetitorCompareInput['promoType'], string> = {
  bonus:      'welcome/deposit bonus',
  tournament: 'tournament',
  loyalty:    'loyalty program',
  wheel:      'wheel-of-fortune promotion',
};

function fmt(v: string | number | undefined): string {
  if (v === undefined || v === null || v === '') return 'н/д';
  return String(v);
}

export function buildCompetitorComparePrompt(input: CompetitorCompareInput): string {
  const { region, promoType, ownOffer, competitors, uiLang } = input;
  const lang   = LANG_NAME[uiLang ?? ''] || 'English';
  const params = COMPARE_PARAMS[promoType];

  const rows = params.map((p) => {
    const own = fmt(ownOffer.params[p.key] as string | number | undefined);
    const comps = competitors.map((c) => {
      const val = fmt(c.params[p.key] as string | number | undefined);
      const flag = c.source === 'ai_search'
        ? (c.confidence === 'unconfirmed' ? ' [AI-unconfirmed]' : ' [AI]')
        : ' [manual]';
      return `${c.name}=${val}${flag}`;
    }).join(' | ');
    return `- ${p.label} (${p.key}): Retomat=${own} | ${comps}`;
  }).join('\n');

  return `You are an iGaming retention strategist. Compare the operator's own ${PROMO_LABEL[promoType]} (built in Retomat, "Retomat") against competitors in the ${region.toUpperCase()} market and judge how competitive it is FROM THE PLAYER'S PERSPECTIVE.

Own offer: ${ownOffer.label || PROMO_LABEL[promoType]}

Normalised comparison (one line per parameter; values already extracted):
${rows}

How to read parameters (player perspective):
- Lower wagering, lower min deposit, longer validity, higher max win, more/fresher prizes, lower entry barrier = MORE attractive to the player.
- Some parameters (tournament distribution & segment reach, wheel occasion, loyalty tier count) are STRATEGIC CHOICES, not strictly better/worse — treat them as trade-offs, not wins/losses.
- Do NOT treat a headline number in isolation: e.g. a big match% or cashback% is weakened by a high wager or a poor redemption rate. Judge the REAL value to the player.

IMPORTANT:
- Any value marked [AI-unconfirmed] or "н/д" is uncertain — never state it as a hard fact; hedge or exclude it, and never base a firm recommendation solely on it.
- Recommendations must reference a concrete competitor benchmark and stay realistic for the ${region.toUpperCase()} market and its regulation.

Write ALL text in ${lang}. Return ONLY valid JSON, no markdown:
{
  "verdict": "<2-3 sentence overall summary of how competitive Retomat's offer is>",
  "strengths": ["<where Retomat is stronger than competitors, concrete>", "..."],
  "weaknesses": ["<where a competitor is more attractive, concrete>", "..."],
  "recommendations": [
    {"param": "<param key or label>", "current": "<Retomat's current value>", "competitorBenchmark": "<competitor value + name>", "suggested": "<specific new value>", "reason": "<why it helps, and any econ/regulatory caveat>", "impact": "high|med|low"}
  ]
}
Give at least one strength, one weakness, and 2-4 recommendations.`;
}
