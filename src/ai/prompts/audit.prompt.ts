import { GEO_CFG, LANG_NAME, SEG_DESC } from '../../domain/campaign/scenarios.js';
import { bonusLine } from '../../domain/ai/parser.js';

interface AuditPromptParams {
  scenario?: { lbl?: string } | null;
  mechanic?: Record<string, unknown> | null;
  mechanicType?: string;
  uiLang?: string;
  params: { geo: string; lang?: string; segment?: string; risk?: string; lic?: string };
}

function getLicRulesBlock(lic: string): string {
  switch (lic.toUpperCase()) {
    case 'DGA':
      return `\nDGA (Spillemyndigheden) MANDATORY RULES — Denmark:
- Statutory hard cap: max bonus 1,000 DKK per offer (any violation = immediate non-compliance)
- Minimum validity: 60 days for wagering completion (statutory minimum, not negotiable)
- ROFUS check: operator MUST verify player is not self-excluded before awarding any bonus
- 2025 update: T&Cs must appear in same font size as the promotional headline
- Wagering: market practice 10–35x; anything above 35x creates player-harm risk flag
- Responsible gambling: all bonuses must include links to Stopspillet.dk
- Bonus stacking: DGA prohibits combining multiple active bonuses simultaneously`;
    case 'UKGC':
      return `\nUKGC MANDATORY RULES — United Kingdom:
- Max bonus contribution cap: £10 per spin or bet while wagering a bonus
- No wagering requirement may exceed what is fair and transparent
- All bonus T&Cs must be presented clearly and prominently
- Gamstop self-exclusion check mandatory before any bonus award
- No time pressure tactics (countdown timers on bonuses are restricted)
- BeGambleAware.org must be referenced`;
    case 'MGA':
      return `\nMGA RULES — Malta / EU:
- Bonus T&Cs must be easily accessible and clearly presented
- Responsible gambling tools (deposit limits, self-exclusion) must be offered
- No misleading claims about winning probability
- Wagering requirements must be clearly stated`;
    case 'CURACAO':
      return `\nCuraçao e-Gaming LICENSE CONTEXT:
- Permissive framework; no statutory bonus or wagering cap
- Operators must maintain basic KYC and AML compliance
- T&Cs must be published on site; no specific format mandated
- No mandatory self-exclusion registry integration required`;
    case 'ANJOUAN':
      return `\nAnjouan (AOFA) LICENSE CONTEXT:
- Offshore permissive license; no statutory bonus cap
- Basic KYC required; no wagering cap mandated
- T&Cs must be accessible; responsible gambling disclaimer recommended
- Newer license: fewer established enforcement precedents`;
    case 'KAHNAWAKE':
      return `\nKahnawake Gaming Commission CONTEXT:
- Canadian indigenous authority; common for North American-facing operators
- No statutory bonus cap; operators self-regulate
- Player dispute resolution mechanism required
- No mandatory self-exclusion registry`;
    case 'GIBRALTAR':
      return `\nGibraltar Regulatory Authority (GRA) CONTEXT:
- Respected European-adjacent license
- Wagering requirements must be fair and clearly communicated
- Responsible gambling tools required
- No statutory bonus cap, but GRA monitors for unfair terms`;
    case 'ISLE_OF_MAN':
      return `\nIsle of Man GSC LICENSE CONTEXT:
- Trusted European jurisdiction
- Bonus T&Cs must be fair, transparent, and clearly displayed
- Responsible gambling obligations apply
- No statutory hard cap on bonuses`;
    default:
      return '';
  }
}

export function buildAuditPrompt({ scenario, mechanic, mechanicType, params, uiLang }: AuditPromptParams): string {
  const geo      = GEO_CFG[params.geo] || GEO_CFG['de'];
  const resolvedLic = (params.lic && params.lic !== 'auto') ? params.lic : (geo.lic || 'none');
  const lic      = resolvedLic.toUpperCase();
  const bonus    = bonusLine(mechanic ?? null, mechanicType ?? '');
  const lang     = LANG_NAME[uiLang ?? ''] || LANG_NAME[params.lang ?? ''] || 'English';
  const licRules = getLicRulesBlock(lic);

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
