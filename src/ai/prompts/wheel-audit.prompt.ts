import { GEO_CFG, LANG_NAME } from '../../domain/campaign/scenarios.js';

interface WheelAuditParams {
  params:  Record<string, unknown>;
  spec:    Record<string, unknown>;
  uiLang?: string;
}

function getLicWheelRules(lic: string): string {
  switch (lic) {
    case 'UKGC':
      return `\nUKGC wheel/gamification rules:
- Odds of each prize segment must be disclosed to players (LCCP transparency)
- No misleading "guaranteed win" framing if an empty segment exists
- Gamstop check before awarding real-money prizes
- BeGambleAware.org reference required`;
    case 'DGA':
      return `\nDGA (Denmark) rules:
- Prize probabilities and T&Cs stated in DKK, no ambiguity
- ROFUS self-exclusion check before awarding prizes
- Wagering on wheel winnings must not exceed 10× (DK legal cap)`;
    case 'MGA':
      return `\nMGA rules:
- Prize distribution and odds must be verifiable in T&Cs
- Responsible-gambling tools accessible from the wheel UI`;
    case 'BETS_BR':
      return `\nBrazil (Law 14.790/2023) rules:
- Welcome/registration-linked bonuses are PROHIBITED — a first-deposit wheel is high-risk
- Prize odds must be transparent`;
    default:
      return '';
  }
}

export function buildWheelAuditPrompt({ params, spec, uiLang }: WheelAuditParams): string {
  const geo = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto') ? String(params['lic']) : (geo.lic || 'none');
  const lic  = resolvedLic.toUpperCase();
  const lang = LANG_NAME[uiLang || String(params['lang'] || 'en')] || 'English';
  const licRules = getLicWheelRules(lic);

  const preset    = String(spec['preset']    || 'welcome');
  const frequency = String(spec['frequency'] || 'daily');
  const segments  = Array.isArray(spec['segments']) ? spec['segments'] as Array<Record<string, unknown>> : [];
  const hasEmpty  = segments.some((s) => s['prizeType'] === 'nothing');
  const segList   = segments.map((s) => `${s['prizeType']}=${s['prizeValue']} (w${s['weight']})`).join(', ');
  const cur       = geo.sitecur;

  return `You are a gambling compliance officer. Audit this "Wheel of Fortune" casino mechanic for risks and compliance issues.

Wheel: ${preset} wheel, cadence: ${frequency}
Segments: ${segList}
Empty segment present: ${hasEmpty ? 'yes' : 'no'}
Region: ${String(params['geo'] || 'de').toUpperCase()}, License: ${lic}, Segment: ${String(params['segment'] || 'depositors')}, Currency: ${cur}
${licRules}
IMPORTANT: Write ALL text fields (label, note, text, impact) in ${lang}.

Audit 5 aspects specific to a prize wheel. For each check include a "rule" field citing the specific regulation. Return ONLY valid JSON, no markdown:
{
  "checks": [
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>", "rule": "<regulation reference>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>", "rule": "<regulation reference>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>", "rule": "<regulation reference>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>", "rule": "<regulation reference>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>", "rule": "<regulation reference>"}
  ],
  "recommendations": [
    {"text": "<specific actionable fix in ${lang}, under 95 chars>", "impact": "<expected benefit in ${lang}, under 55 chars>"}
  ]
}
Focus audit on: prize-odds transparency, empty-segment framing, wagering on winnings, prize-value ceiling / abuse risk, responsible gambling. Give 2-4 recommendations.`;
}
