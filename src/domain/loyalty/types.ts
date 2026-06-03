export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type LoyaltyMode = 'tiers' | 'missions' | 'hybrid';
export type MissionObjective = 'deposit' | 'wager' | 'sessions' | 'consecutive_days';
export type MissionRewardType = 'points' | 'free_spins' | 'cash_bonus';
export type MissionFrequency = 'one_time' | 'weekly' | 'monthly';

export interface LoyaltyTier {
  name: TierName;
  label: string;
  minPoints: number;        // cumulative points to reach this tier
  bonusMultiplier: number;  // earn rate multiplier vs bronze (1.0 = base)
  cashbackRate: number;     // monthly cashback on net losses (0.0–0.20)
  freeSpinsMonthly: number;
  depositBonusPct: number;  // deposit bonus on tier upgrade
  maxBonus: number;         // max bonus value in USD
}

export interface EarnRedeemConfig {
  earnRateDeposit: number;  // points per $1 deposited
  earnRateWager: number;    // points per $1 wagered
  redeemRate: number;       // points needed per $1 of redemption value
  redeemMinPoints: number;  // minimum points to trigger redemption
  pointsExpiry: number;     // days (0 = no expiry)
}

export interface MissionTierLink {
  tierPointsContribution: number;   // points per completion → tier progress
  monthlyTierPoints:      number;   // steady-state monthly contribution (one_time → 0)
  multiplierBoost:        number;   // temporary +Δ to bonusMultiplier on completion (0–0.5)
  boostDurationDays:      number;   // duration of the multiplier boost
  eligibleTiers:          TierName[]; // tiers where this mission is active
  acceleratesUpgrade:     boolean;  // monthlyTierPoints > 0
}

export interface Mission {
  id: string;
  name: string;
  objective: MissionObjective;
  target: number;
  rewardType: MissionRewardType;
  rewardValue: number;
  frequency: MissionFrequency;
  link?:      MissionTierLink;  // populated only for mode==='hybrid'
  narrative?: string;           // filled by AI layer (Phase 2)
}

export interface LoyaltyConfig {
  mode: LoyaltyMode;
  tiers: LoyaltyTier[];
  earnRedeem: EarnRedeemConfig;
  missions: Mission[];
  hasMissions: boolean;
  region: string;
  segment: string;
  players: number;
  avgdep: number;  // avg deposit USD/month
  arpu: number;    // ARPU USD/month
}

export interface LoyaltyEcon {
  // Per-player monthly averages
  avgEarnedPointsPerPlayer: number;
  avgRedeemedPointsPerPlayer: number;
  pointRedemptionRate: number;    // fraction of earned points that get redeemed
  liabilityPerPlayer: number;     // unredeemed points value in USD

  // Portfolio (monthly, all players)
  totalLiabilityUSD: number;
  monthlyCostUSD: number;
  missionCostUSD: number;
  tierRewardCostUSD: number;
  costRatioPct: number;           // monthlyCostUSD as % of monthly GGR

  // Retention impact
  retentionLiftPct: number;       // estimated churn reduction %
  additionalRevenue3m: number;    // extra revenue over 3 months from lift
  breakEvenMonths: number | null; // months until program breaks even; null = never (unprofitable)
  roi3m: number;                  // additionalRevenue3m / (3 × monthlyCostUSD)
}

export interface LoyaltyBuildParams {
  mode: LoyaltyMode;
  numTiers: 3 | 4 | 5;
  topCashbackRate: number;    // cashback at top tier, e.g. 0.15
  earnRateDeposit: number;    // e.g. 10 pts per $1
  earnRateWager: number;      // e.g. 1 pt per $1
  redeemRate: number;         // e.g. 100 pts = $1
  redeemMinPoints: number;    // e.g. 1000
  pointsExpiry: number;       // days, 0 = never
  missionCount: number;       // 0–6
  region: string;
  segment: string;
  players: number;
  avgdep: number;
  arpu: number;
}
