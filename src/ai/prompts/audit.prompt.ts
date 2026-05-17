import { GEO_CFG, LANG_NAME, SEG_DESC } from '../../domain/campaign/scenarios.js';
import { bonusLine } from '../../domain/ai/parser.js';

interface AuditPromptParams {
  scenario?: { lbl?: string } | null;
  mechanic?: Record<string, unknown> | null;
  mechanicType?: string;
  uiLang?: string;
  params: { geo: string; lang?: string; segment?: string; risk?: string };
}

export function buildAuditPrompt({ scenario, mechanic, mechanicType, params, uiLang }: AuditPromptParams): string {
  const geo   = GEO_CFG[params.geo] || GEO_CFG['de'];
  const lic   = (geo.lic || 'none').toUpperCase();
  const bonus = bonusLine(mechanic ?? null, mechanicType ?? '');
  const lang  = LANG_NAME[uiLang ?? ''] || LANG_NAME[params.lang ?? ''] || 'English';

  const licRules = lic === 'DGA'
    ? `\nDGA (Spillemyndigheden) MANDATORY RULES — Denmark:
- Statutory hard cap: max bonus 1,000 DKK per offer (any violation = immediate non-compliance)
- Minimum validity: 60 days for wagering completion (statutory minimum, not negotiable)
- ROFUS check: operator MUST verify player is not self-excluded before awarding any bonus
- 2025 update: T&Cs must appear in same font size as the promotional headline
- Wagering: market practice 10–35x; anything above 35x creates player-harm risk flag
- Responsible gambling: all bonuses must include links to Stopspillet.dk
- Bonus stacking: DGA prohibits combining multiple active bonuses simultaneously`
    : '';

  return `You are a gambling compliance officer. Audit this CRM bonus campaign for risks and compliance issues.

Campaign: ${scenario?.lbl || 'Reactivation'}
Bonus: ${bonus}
Region: ${params.geo?.toUpperCase()}, License: ${lic}
Segment: ${SEG_DESC[params.segment ?? ''] || 'regular players'}, Risk: ${params.risk || 'low'}
${licRules}
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
