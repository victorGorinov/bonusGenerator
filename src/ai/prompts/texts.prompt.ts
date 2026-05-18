import { GEO_CFG, TONE_DESC, LANG_NAME, SEG_DESC } from '../../domain/campaign/scenarios.js';
import { bonusLine } from '../../domain/ai/parser.js';

interface TextsPromptParams {
  scenario?: { lbl?: string } | null;
  mechanic?: Record<string, unknown> | null;
  mechanicType?: string;
  params: { geo: string; lang?: string; tone?: string; segment?: string; lic?: string };
}

function getLicContextBlock(lic: string): string {
  switch (lic.toUpperCase()) {
    case 'DGA':
      return `\nDGA compliance requirements for all texts:
- Every communication MUST include T&Cs in the same visual prominence as the offer
- Include "Gælder for nye spillere" (new players) or "Gælder for eksisterende spillere" as applicable
- Reference Stopspillet.dk in at least one text element per channel
- Do NOT use phrases implying guaranteed wins or loss recovery
- Max bonus cap (1.000 DKK) must be stated explicitly in email and popup
- Wagering requirement must be clearly stated — no hiding behind fine print
- Danish regulatory standard: 18+ and "Spil ansvarligt" must appear in email footer`;
    case 'UKGC':
      return `\nUKGC compliance requirements for all texts:
- All bonus T&Cs must be presented clearly and at the same prominence as the offer
- Include BeGambleAware.org reference in email footer
- No time pressure language (e.g. "act now or lose your bonus")
- Max bonus contribution cap (£10/spin) must be mentioned in email and popup
- 18+ and responsible gambling message required in every channel`;
    case 'MGA':
      return `\nMGA compliance note:
- Bonus T&Cs must be clearly accessible in every communication
- Include responsible gambling reminder and link to player support tools
- No misleading win-probability claims`;
    case 'CURACAO':
      return `\nCuraçao license context:
- Include 18+ disclaimer and T&Cs reference in email footer
- No statutory format requirements; maintain standard responsible gambling messaging`;
    case 'ANJOUAN':
      return `\nAnjouan license context:
- Include 18+ disclaimer and T&Cs reference
- Responsible gambling disclaimer recommended`;
    case 'KAHNAWAKE':
      return `\nKahnawake license context:
- Include 18+ disclaimer and T&Cs link
- Mention player dispute resolution availability`;
    case 'GIBRALTAR':
      return `\nGibraltar (GRA) license context:
- Wagering requirements must be clearly communicated
- Include responsible gambling tools reference`;
    case 'ISLE_OF_MAN':
      return `\nIsle of Man (GSC) license context:
- Bonus T&Cs must be fair, transparent, and clearly displayed
- Responsible gambling obligations apply`;
    default:
      return '';
  }
}

export function buildTextsPrompt({ scenario, mechanic, mechanicType, params }: TextsPromptParams): string {
  const geo        = GEO_CFG[params.geo] || GEO_CFG['de'];
  const resolvedLic = (params.lic && params.lic !== 'auto') ? params.lic : (geo.lic || 'none');
  const lic        = resolvedLic.toUpperCase();
  const lang       = LANG_NAME[params.lang ?? ''] || 'English';
  const tone       = TONE_DESC[params.tone ?? ''] || TONE_DESC['friendly'];
  const seg        = SEG_DESC[params.segment ?? ''] || SEG_DESC['mid'];
  const bonus      = bonusLine(mechanic ?? null, mechanicType ?? '');
  const licContext = getLicContextBlock(lic);

  return `You are a senior CRM marketing expert for an online casino. Generate 3 compelling variants (A, B, C) for each communication channel.

Campaign context:
- Scenario: ${scenario?.lbl || 'Player reactivation'}
- Bonus: ${bonus}
- Region: ${params.geo?.toUpperCase()} / License: ${lic}
- Audience: ${seg}
- Language: ${lang}
- Tone: ${tone}
${licContext}
Return ONLY valid JSON, no markdown, no extra text:
{
  "push": ["<70-100 chars, 1-2 emojis>", "variant B", "variant C"],
  "email": [
    {"subject": "<45-60 chars>", "body": "<60-90 words, include 1 T&C sentence>"},
    {"subject": "...", "body": "..."},
    {"subject": "...", "body": "..."}
  ],
  "sms": ["<MAX 160 chars, end: STOP>", "variant B", "variant C"],
  "telegram": ["<*bold* _italic_, 120-200 chars>", "variant B", "variant C"],
  "popup": [
    {"headline": "<max 45 chars>", "subtext": "<max 75 chars>", "cta": "<max 22 chars, button text>"},
    {"headline": "...", "subtext": "...", "cta": "..."},
    {"headline": "...", "subtext": "...", "cta": "..."}
  ]
}
All texts in ${lang}. Include bonus code and key conditions in every variant.`;
}
