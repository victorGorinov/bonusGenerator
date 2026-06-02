export interface LoyaltyOptimizePromptInput {
  config: Record<string, unknown>;
  econ:   Record<string, unknown>;
  uiLang?: string;
}

function langName(code: string): string {
  const MAP: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', es: 'Spanish' };
  return MAP[code] || 'English';
}

const BENCHMARKS = {
  costRatio:     { lo: 5,   hi: 15  }, // % of GGR
  retentionLift: { lo: 8,   hi: 20  }, // %
  roi3m:         { lo: 1.0, hi: 3.0 }, // multiplier
  breakEven:     { lo: 1,   hi: 6   }, // months
};

export function buildLoyaltyOptimizePrompt({ config, econ, uiLang }: LoyaltyOptimizePromptInput): string {
  const mode       = String(config['mode']    ?? 'hybrid');
  const region     = String(config['region']  ?? 'eu');
  const segment    = String(config['segment'] ?? 'mid');
  const numTiers   = Number((config['tiers'] as unknown[])?.length ?? 5);

  const earnRedeem  = (config['earnRedeem'] as Record<string, unknown>) ?? {};
  const earnDep     = Number(earnRedeem['earnRateDeposit'] ?? 10);
  const earnWag     = Number(earnRedeem['earnRateWager']   ?? 1);
  const redeemRate  = Number(earnRedeem['redeemRate']      ?? 100);
  const expiry      = Number(earnRedeem['pointsExpiry']    ?? 0);
  const missions    = (config['missions'] as unknown[]) ?? [];

  const tiers       = (config['tiers'] as Array<Record<string, unknown>> | undefined) ?? [];
  const topTier     = tiers[tiers.length - 1] as Record<string, unknown> | undefined;
  const topCashback = Number(topTier?.['cashbackRate'] ?? 0) * 100;

  const costRatio   = Number(econ['costRatioPct']    ?? 0).toFixed(1);
  const retLift     = Number(econ['retentionLiftPct'] ?? 0).toFixed(1);
  const roi3m       = Number(econ['roi3m']            ?? 0).toFixed(2);
  const breakEven   = Number(econ['breakEvenMonths']  ?? 0).toFixed(1);
  const monthlyCost = Number(econ['monthlyCostUSD']   ?? 0).toFixed(0);
  const liability   = Number(econ['totalLiabilityUSD'] ?? 0).toFixed(0);

  const b = BENCHMARKS;
  const lang = langName(uiLang || 'en');

  const costStatus   = Number(costRatio)  <= b.costRatio.hi  ? 'within' : 'above';
  const liftStatus   = Number(retLift)    >= b.retentionLift.lo ? 'within' : 'below';
  const roiStatus    = Number(roi3m)      >= b.roi3m.lo      ? 'within' : 'below';
  const breakStatus  = Number(breakEven)  <= b.breakEven.hi  ? 'within' : 'above';

  return `You are a loyalty program strategist. Analyze this iGaming loyalty program's economics and recommend optimizations.

Program: ${mode} mode, ${numTiers} tiers, region ${region.toUpperCase()}, segment ${segment}
Top-tier cashback: ${topCashback.toFixed(1)}%
Earn: ${earnDep} pts/$1 deposit, ${earnWag} pts/$1 wager
Redeem: ${redeemRate} pts = $1, expiry: ${expiry === 0 ? 'none' : `${expiry} mo`}
Missions: ${missions.length}

Economics vs benchmarks:
| Metric         | Current     | Benchmark              | Status        |
|----------------|-------------|------------------------|---------------|
| Cost / GGR     | ${costRatio}%      | ${b.costRatio.lo}–${b.costRatio.hi}%           | ${costStatus} benchmark |
| Retention lift | ${retLift}%       | ${b.retentionLift.lo}–${b.retentionLift.hi}%          | ${liftStatus} benchmark |
| 3-month ROI    | ${roi3m}×         | ${b.roi3m.lo}–${b.roi3m.hi}×              | ${roiStatus} benchmark |
| Break-even     | ${breakEven} mo    | ${b.breakEven.lo}–${b.breakEven.hi} mo             | ${breakStatus} benchmark |
| Monthly cost   | $${monthlyCost}        | —                      | — |
| Points liability | $${liability}     | —                      | — |

IMPORTANT: Write all text in ${lang}.

Give 2-4 specific, actionable parameter changes. Use only these param names: topCashbackRate, earnRateDeposit, earnRateWager, redeemRate, missionCount, numTiers, mode, pointsExpiry.

Units to use in "current"/"target" values:
- topCashbackRate → percentage, e.g. "5.0%"
- earnRateDeposit / earnRateWager → pts per $1, e.g. "10 pts/$1"
- redeemRate → pts per $1, e.g. "100 pts/$1"
- missionCount / numTiers → integer, e.g. "5"
- pointsExpiry → months or "none", e.g. "12 mo" or "none"
- mode → string, e.g. "hybrid"

Return ONLY valid JSON, no markdown:
{
  "recommendations": [
    {"param": "<param name>", "current": "<value with unit>", "target": "<suggested value with unit>", "reason": "<why this improves economics, under 100 chars>", "impact": "high|med|low"},
    ...
  ]
}`;
}
