import { GEO_CFG, LANG_NAME, SEG_DESC } from '../../domain/campaign/scenarios.js';
import { bonusLine } from '../../domain/ai/parser.js';

export function buildAuditPrompt({ scenario, mechanic, mechanicType, params, uiLang }) {
  const geo   = GEO_CFG[params.geo] || GEO_CFG['de'];
  const lic   = (geo.lic || 'none').toUpperCase();
  const bonus = bonusLine(mechanic, mechanicType);
  const lang  = LANG_NAME[uiLang] || LANG_NAME[params.lang] || 'English';

  return `You are a gambling compliance officer. Audit this CRM bonus campaign for risks and compliance issues.

Campaign: ${scenario?.lbl || 'Reactivation'}
Bonus: ${bonus}
Region: ${params.geo?.toUpperCase()}, License: ${lic}
Segment: ${SEG_DESC[params.segment]||'regular players'}, Risk: ${params.risk||'low'}

IMPORTANT: Write ALL text fields (label, note, text, impact) in ${lang}.

Audit 5 aspects. Return ONLY valid JSON, no markdown:
{
  "checks": [
    {"label": "<aspect name in ${lang}>", "status": "ok",      "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"}
  ],
  "recommendations": [
    {"text": "<specific actionable fix in ${lang}, under 95 chars>", "impact": "<expected benefit in ${lang}, under 55 chars>"}
  ]
}
Give 2-4 recommendations. Be specific to the actual bonus parameters and region.`;
}
