import type { LoyaltyConfig, LoyaltyMode } from './types.js';

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

export function calcRetentionLift(cfg: LoyaltyConfig): number {
  const base      = SEG_BASE[cfg.segment] ?? SEG_BASE['mid'];
  const modeMult  = MODE_MULT[cfg.mode];
  const tierMult  = TIER_DEPTH_MULT[cfg.tiers.length] ?? 1.00;
  const earn      = earnFactor(cfg.earnRedeem.earnRateDeposit);

  return Math.min(0.35, base * modeMult * tierMult * earn);
}
