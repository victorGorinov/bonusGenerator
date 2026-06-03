import type { LoyaltyConfig, LoyaltyMode, MissionTierLink } from './types.js';

const SEG_BASE: Record<string, number> = {
  new: 0.08,
  mid: 0.12,
  vip: 0.18,
};

const MODE_MULT: Record<LoyaltyMode, number> = {
  tiers:   0.85,
  missions: 0.90,
  hybrid:  1.00,
};

const TIER_DEPTH_MULT: Record<number, number> = {
  3: 0.85,
  4: 0.95,
  5: 1.00,
};

// Generous earn rates improve program perception → slight lift boost
function earnFactor(earnRateDeposit: number): number {
  return Math.min(1.10, 0.90 + earnRateDeposit / 100);
}

// For hybrid mode: missions feeding tier points create synergy lift
// tierAccel = total monthly mission points / baseline monthly earn, capped at 0.5
// synergy contributes up to +10% lift (0.20 × 0.5). Overall cap remains 0.35.
function synergyFactor(cfg: LoyaltyConfig): number {
  if (cfg.mode !== 'hybrid') return 1;
  const monthlyEarnBaseline = cfg.avgdep * cfg.earnRedeem.earnRateDeposit;
  if (monthlyEarnBaseline <= 0) return 1;
  const totalMonthlyMissionPts = cfg.missions.reduce((acc, m) => {
    const link = (m as { link?: MissionTierLink }).link;
    return acc + (link?.monthlyTierPoints ?? 0);
  }, 0);
  const tierAccel = Math.min(0.5, totalMonthlyMissionPts / monthlyEarnBaseline);
  return 1 + 0.20 * tierAccel;
}

export function calcRetentionLift(cfg: LoyaltyConfig): number {
  const base     = SEG_BASE[cfg.segment] ?? SEG_BASE['mid'];
  const modeMult = MODE_MULT[cfg.mode];
  const tierMult = TIER_DEPTH_MULT[cfg.tiers.length] ?? 1.00;
  const earn     = earnFactor(cfg.earnRedeem.earnRateDeposit);
  const synergy  = synergyFactor(cfg);

  return Math.min(0.35, base * modeMult * tierMult * earn * synergy);
}
