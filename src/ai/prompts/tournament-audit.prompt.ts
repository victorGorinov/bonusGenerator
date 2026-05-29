import { GEO_CFG, LANG_NAME } from '../../domain/campaign/scenarios.js';

interface TournamentAuditParams {
  type:    string;
  params:  Record<string, unknown>;
  spec:    Record<string, unknown>;
  uiLang?: string;
}

function getLicTournamentRules(lic: string): string {
  switch (lic) {
    case 'DGA':
      return `\nDGA (Denmark) tournament rules:
- Prize pool must be clearly stated in DKK with no ambiguity
- T&Cs must appear in same font size as promotional headline
- ROFUS self-exclusion check mandatory before any entry award
- No bonus stacking with active deposit bonuses
- Stopspillet.dk must be referenced in tournament promotions`;
    case 'UKGC':
      return `\nUKGC tournament rules:
- Max prize contribution capped at fair and transparent terms per LCCP
- No countdown-timer pressure tactics on leaderboard
- All T&Cs clearly accessible alongside tournament promotional material
- Gamstop check required before awarding tournament prizes
- BeGambleAware.org reference required`;
    case 'MGA':
      return `\nMGA tournament compliance:
- Prize pool and distribution rules must be clearly stated in T&Cs
- Players must be able to verify leaderboard standings in real time
- Responsible gambling tools must be offered and accessible during tournament`;
    default:
      return '';
  }
}

export function buildTournamentAuditPrompt({ type, params, spec, uiLang }: TournamentAuditParams): string {
  const geo = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto')
    ? String(params['lic']) : (geo.lic || 'none');
  const lic      = resolvedLic.toUpperCase();
  const lang     = LANG_NAME[uiLang || String(params['lang'] || 'en')] || 'English';
  const licRules = getLicTournamentRules(lic);

  const prizePool  = Number(spec['prizePool']  || params['prizePool']  || 0);
  const poolModel  = String(params['poolModel'] || 'fixed');
  const rake       = Number(params['rake']      || 0);
  const reentry    = String(params['reentry']   || 'single');
  const entryModel = String(params['entryModel'] || 'freeroll');
  const scoring    = String(params['scoring']   || 'total_wins');
  const cur        = geo.sitecur;

  return `You are a gambling compliance officer. Audit this casino tournament for risks and compliance issues.

Tournament: ${type} tournament
Prize pool: ${cur} ${prizePool.toLocaleString()} (${poolModel} model${rake ? `, rake ${rake}%` : ''})
Entry: ${entryModel}, re-entry: ${reentry}
Scoring: ${scoring}
Region: ${String(params['geo'] || 'de').toUpperCase()}, License: ${lic}
Segment: ${String(params['segment'] || 'all')}
${licRules}
IMPORTANT: Write ALL text fields (label, note, text, impact) in ${lang}.

Audit 5 aspects specific to tournaments. Return ONLY valid JSON, no markdown:
{
  "checks": [
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"}
  ],
  "recommendations": [
    {"text": "<specific actionable fix in ${lang}, under 95 chars>", "impact": "<expected benefit in ${lang}, under 55 chars>"}
  ]
}
Focus audit on: prize pool transparency, entry fairness, re-entry risk, scoring integrity, responsible gambling. Give 2-4 recommendations.`;
}
