export interface LoyaltyTextsPromptInput {
  config: Record<string, unknown>;
  econ:   Record<string, unknown>;
  uiLang?: string;
}

function langName(code: string): string {
  const MAP: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', es: 'Spanish' };
  return MAP[code] || 'English';
}

export function buildLoyaltyTextsPrompt({ config, econ, uiLang }: LoyaltyTextsPromptInput): string {
  const mode      = String(config['mode']     ?? 'hybrid');
  const region    = String(config['region']   ?? 'eu');
  const segment   = String(config['segment']  ?? 'mid');
  const tiers     = (config['tiers'] as Array<Record<string, unknown>> | undefined) ?? [];
  const tierNames = tiers.map(t => String(t['name'] || t['label'] || '')).filter(Boolean);
  const topTier   = tierNames[tierNames.length - 1] ?? 'Diamond';
  const missions  = (config['missions'] as unknown[]) ?? [];

  const earnRedeem  = (config['earnRedeem'] as Record<string, unknown>) ?? {};
  const earnDep     = Number(earnRedeem['earnRateDeposit'] ?? 10);
  const redeemRate  = Number(earnRedeem['redeemRate']      ?? 100);

  const topCashback = (() => {
    const lastTier = tiers[tiers.length - 1] as Record<string, unknown> | undefined;
    const raw = Number(lastTier?.['cashbackRate'] ?? 0) * 100;
    return raw.toFixed(0);
  })();

  const costRatio = Number(econ['costRatioPct'] ?? 0).toFixed(1);
  const roi3m     = Number(econ['roi3m']        ?? 0).toFixed(1);

  const lang = langName(uiLang || 'en');

  const modeDesc   = { tiers: 'tier-based VIP ladder', missions: 'mission-driven rewards', hybrid: 'tier ladder with missions' }[mode] ?? mode;
  const segDesc    = { new: 'new players', mid: 'regular players', vip: 'VIP players' }[segment] ?? segment;
  const ladderStr  = tierNames.length > 0 ? `${tierNames[0]} → ${topTier}` : 'Bronze → Diamond';
  const missionStr = missions.length > 0 ? ` + ${missions.length} missions` : '';

  return `You are a CRM copywriter for an online casino. Write promotional texts to launch a new loyalty program to existing players.

Program: ${modeDesc} (${ladderStr}${missionStr})
Target: ${segDesc} in ${region.toUpperCase()} market
Top-tier cashback: ${topCashback}% · Earn rate: ${earnDep} points per $1 deposit · Redeem: ${redeemRate} pts = $1
Economics: cost/GGR = ${costRatio}% · 3-month ROI = ${roi3m}×

Guidelines:
- Push/SMS/Telegram: under 100 chars, punchy, specific benefit first
- Email body: 3-5 sentences, highlight tier ladder and cashback; include CTA
- Popup: headline ≤ 40 chars, subtext ≤ 70 chars, CTA ≤ 20 chars
- Write all text fields in ${lang}. Do not use placeholder text.

Return ONLY valid JSON, no markdown:
{
  "push":     ["<push 1>", "<push 2>", "<push 3>"],
  "email":    [{"subject": "...", "body": "..."}, {"subject": "...", "body": "..."}, {"subject": "...", "body": "..."}],
  "sms":      ["<sms 1>", "<sms 2>", "<sms 3>"],
  "telegram": ["<telegram 1>", "<telegram 2>", "<telegram 3>"],
  "popup":    [{"headline": "...", "subtext": "...", "cta": "..."}, {"headline": "...", "subtext": "...", "cta": "..."}, {"headline": "...", "subtext": "...", "cta": "..."}]
}`;
}
