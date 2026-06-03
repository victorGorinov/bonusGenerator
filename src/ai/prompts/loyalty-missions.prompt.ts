export interface LoyaltyMissionsPromptInput {
  config: Record<string, unknown>;
  econ?:  Record<string, unknown>;
  uiLang?: string;
}

function langName(code: string): string {
  const MAP: Record<string, string> = { en: 'English', ru: 'Russian', mn: 'Mongolian', es: 'Spanish' };
  return MAP[code] || 'English';
}

function regionCurrency(region: string): string {
  const MAP: Record<string, string> = {
    eu:     'EUR',
    cis:    'USD',
    mn:     'USD',
    latam:  'USD',
    sweep:  'USD',
    crypto: 'USD',
  };
  return MAP[region] ?? 'USD';
}

function fmtLink(link: Record<string, unknown>): string {
  const moPts    = Number(link['monthlyTierPoints'] ?? 0);
  const boost    = Number(link['multiplierBoost']   ?? 0).toFixed(2).replace(/\.?0+$/, '');
  const dur      = Number(link['boostDurationDays'] ?? 0);
  const tiers    = (link['eligibleTiers'] as string[] | undefined)?.join(', ') ?? 'all tiers';
  const accel    = Boolean(link['acceleratesUpgrade']);
  return `tier pts/mo: ${moPts}, multiplier boost: +${boost}× for ${dur}d, eligible tiers: ${tiers}${accel ? ', accelerates tier upgrade' : ''}`;
}

export function buildLoyaltyMissionsPrompt({ config, uiLang }: LoyaltyMissionsPromptInput): string {
  const mode     = String(config['mode']    ?? 'hybrid');
  const region   = String(config['region']  ?? 'eu');
  const segment  = String(config['segment'] ?? 'mid');
  const missions = (config['missions'] as Array<Record<string, unknown>> | undefined) ?? [];
  const lang     = langName(uiLang || 'en');
  const currency = regionCurrency(region);
  const isHybrid = mode === 'hybrid';

  const missionLines = missions.map(m => {
    const link = m['link'] as Record<string, unknown> | undefined;
    const linkLine = isHybrid && link
      ? `\n  Tier link: ${fmtLink(link)}`
      : '';
    return `- id: ${m['id']}, name: "${m['name']}", objective: ${m['objective']}, target: ${m['target']}, reward: ${m['rewardValue']} ${m['rewardType']}, frequency: ${m['frequency']}${linkLine}`;
  }).join('\n');

  return `You are a CRM copywriter for an iGaming loyalty program. Write 1–2 sentence mission descriptions.

Program: ${mode} mode, region ${region.toUpperCase()}, segment ${segment}, currency ${currency}.
${isHybrid ? 'This is a hybrid program where missions contribute tier points and give temporary multiplier boosts.' : ''}

Missions:
${missionLines}

Rules:
- 1–2 sentences per mission: (a) what the player does, (b) what they earn${isHybrid ? ', (c) how it advances their tier or boosts their multiplier' : ''}.
- Use CRM-promotional tone. No placeholders. No numbering.
- For hybrid: reference the specific numbers from "Tier link" — do not invent them. E.g. "earn +0.25× bonus multiplier for 7 days".
- Do not contradict any numbers given above.
- IMPORTANT: All monetary amounts must use ${currency}. Never use any other currency symbol or name.
- IMPORTANT: Write all text in ${lang}.

Return ONLY valid JSON, no markdown:
{
  "missions": [
    {"id": "<mission id>", "narrative": "<1-2 sentence description>"${isHybrid ? ', "tierEffect": "<one phrase about tier/multiplier impact>"' : ''}},
    ...
  ]
}`;
}
