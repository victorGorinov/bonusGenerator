export interface LoyaltyAuditPromptInput {
  config: Record<string, unknown>;
  uiLang?: string;
}

function langName(code: string): string {
  const MAP: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', es: 'Spanish' };
  return MAP[code] || 'English';
}

function getLicRules(region: string): string {
  switch (region) {
    case 'eu':
      return `\nEU/MGA loyalty compliance:
- Cashback T&Cs must state wagering requirements, if any (MGA CRP/2016 §7)
- Points expiry rules must be disclosed before program enrollment
- Tier downgrade criteria must be clearly defined and communicated
- GamblingTherapy.org or equivalent RG resource reference required
- Player must be able to opt out of loyalty program at any time`;
    case 'uk':
      return `\nUKGC loyalty compliance:
- No VIP scheme for self-excluded or problem gamblers (LCCP SR Code 6.1.1)
- Tier benefit value must not incentivise increased gambling (LCCP Ordinary Code 5.1)
- BeGambleAware.org reference required in all loyalty communications
- Cashback must not be treated as a bonus if wagering-free — verify classification
- Clear T&Cs for tier expiry and downgrade required`;
    case 'cis':
      return `\nCIS market notes (non-licensed jurisdictions):
- No formal regulatory framework; apply MGA-level transparency as best practice
- Points valuations and redemption rates must be clearly stated
- Program must not obscure net cost to player`;
    default:
      return `\nGeneral compliance best practices:
- Cashback terms (wagering, min bet, expiry) must be clearly disclosed
- Points earn/redeem rates must be transparent and easy to calculate
- Tier downgrade and expiry rules must be prominently communicated`;
  }
}

export function buildLoyaltyAuditPrompt({ config, uiLang }: LoyaltyAuditPromptInput): string {
  const mode    = String(config['mode']    ?? 'hybrid');
  const region  = String(config['region'] ?? 'eu');
  const segment = String(config['segment'] ?? 'mid');

  const earnRedeem   = (config['earnRedeem'] as Record<string, unknown>) ?? {};
  const expiry       = Number(earnRedeem['pointsExpiry']  ?? 0);
  const redeemMin    = Number(earnRedeem['redeemMinPoints'] ?? 0);
  const earnDep      = Number(earnRedeem['earnRateDeposit'] ?? 10);
  const redeemRate   = Number(earnRedeem['redeemRate']    ?? 100);

  const tiers    = (config['tiers'] as Array<Record<string, unknown>> | undefined) ?? [];
  const missions = (config['missions'] as unknown[]) ?? [];

  const topTier      = tiers[tiers.length - 1] as Record<string, unknown> | undefined;
  const topCashback  = Number(topTier?.['cashbackRate'] ?? 0) * 100;
  const expiryStr    = expiry === 0 ? 'Never (no expiry)' : `${expiry} months`;
  const licRules     = getLicRules(region);
  const lang         = langName(uiLang || 'en');
  const modeDesc     = { tiers: 'Tiers-only', missions: 'Missions-only', hybrid: 'Hybrid (tiers + missions)' }[mode] ?? mode;

  return `You are a gambling compliance officer. Audit this loyalty program for regulatory risks and player protection issues.

Program type: ${modeDesc}
Region: ${region.toUpperCase()}, Segment: ${segment}
Tiers: ${tiers.length} (${tiers.map(t => String(t['name'] || t['label'])).join(' → ')})
Top cashback: ${topCashback.toFixed(1)}% of net losses
Earn: ${earnDep} pts per $1 deposit, Redeem: ${redeemRate} pts = $1, Min to redeem: ${redeemMin} pts
Points expiry: ${expiryStr}
Missions: ${missions.length}
${licRules}

IMPORTANT: Write ALL text fields (label, note, text, impact) in ${lang}.

Audit exactly 5 compliance aspects specific to loyalty programs. For each check include a "rule" field citing a specific regulation or best-practice principle. Return ONLY valid JSON, no markdown:
{
  "checks": [
    {"label": "<aspect>", "status": "ok|warn", "note": "<under 90 chars>", "rule": "<regulation or principle>"},
    {"label": "<aspect>", "status": "ok|warn", "note": "<under 90 chars>", "rule": "<regulation or principle>"},
    {"label": "<aspect>", "status": "ok|warn", "note": "<under 90 chars>", "rule": "<regulation or principle>"},
    {"label": "<aspect>", "status": "ok|warn", "note": "<under 90 chars>", "rule": "<regulation or principle>"},
    {"label": "<aspect>", "status": "ok|warn", "note": "<under 90 chars>", "rule": "<regulation or principle>"}
  ],
  "recommendations": [
    {"text": "<actionable fix, under 95 chars>", "impact": "<expected benefit, under 55 chars>"}
  ]
}
Focus on: cashback T&C transparency, points expiry disclosure, tier downgrade rules, responsible gambling opt-out, mission fairness. Give 2-4 recommendations.`;
}
