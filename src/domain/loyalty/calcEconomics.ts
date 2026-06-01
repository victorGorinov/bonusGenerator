import type { LoyaltyConfig, LoyaltyEcon, TierName } from './types.js';
import { calcRetentionLift } from './retentionLift.js';

const WAGER_MULTIPLIER  = 5;    // players wager ~5× their avg deposit
const REDEMPTION_RATE   = 0.40; // 40% of earned points are redeemed; 60% = breakage
const FS_VALUE_USD      = 0.10; // $0.10 per free spin (industry standard)
const MISSION_COMPLETION = 0.35; // 35% of eligible players complete a given mission period

// Player distribution across tiers, indexed by (numTiers - 3)
const TIER_DIST: Record<TierName, number>[] = [
  // 3 tiers: bronze / silver / gold
  { bronze: 0.50, silver: 0.32, gold: 0.18, platinum: 0, diamond: 0 },
  // 4 tiers
  { bronze: 0.50, silver: 0.25, gold: 0.15, platinum: 0.10, diamond: 0 },
  // 5 tiers
  { bronze: 0.50, silver: 0.25, gold: 0.15, platinum: 0.07, diamond: 0.03 },
];

export function calcLoyaltyEconomics(cfg: LoyaltyConfig): LoyaltyEcon {
  const { players, avgdep, arpu, tiers, earnRedeem, missions, hasMissions } = cfg;

  // ── Points earned per player per month ──
  const depositPts             = avgdep * earnRedeem.earnRateDeposit;
  const wagerPts               = avgdep * WAGER_MULTIPLIER * earnRedeem.earnRateWager;
  const avgEarnedPointsPerPlayer = depositPts + wagerPts;

  // ── Redemption ──
  const avgRedeemedPointsPerPlayer = avgEarnedPointsPerPlayer * REDEMPTION_RATE;
  const redemptionValuePerPlayer   = avgRedeemedPointsPerPlayer / earnRedeem.redeemRate;
  const redemptionCostUSD          = players * redemptionValuePerPlayer;

  // ── Liability (unredeemed points as USD value) ──
  const liabilityPts        = avgEarnedPointsPerPlayer * (1 - REDEMPTION_RATE);
  const liabilityPerPlayer  = liabilityPts / earnRedeem.redeemRate;
  const totalLiabilityUSD   = players * liabilityPerPlayer;

  // ── Tier reward costs (cashback + FS per tier) ──
  const distIdx = Math.min(tiers.length - 3, 2);
  const dist    = TIER_DIST[distIdx] ?? TIER_DIST[2];

  let tierRewardCostUSD = 0;
  for (const tier of tiers) {
    const share = dist[tier.name] ?? 0;
    const n     = players * share;
    tierRewardCostUSD += n * tier.cashbackRate * arpu;              // cashback on net losses
    tierRewardCostUSD += n * tier.freeSpinsMonthly * FS_VALUE_USD;  // monthly FS
  }

  // ── Mission reward costs ──
  let missionCostUSD = 0;
  if (hasMissions) {
    for (const m of missions) {
      let rewardUSD: number;
      if      (m.rewardType === 'cash_bonus')  rewardUSD = m.rewardValue;
      else if (m.rewardType === 'free_spins')  rewardUSD = m.rewardValue * FS_VALUE_USD;
      else                                     rewardUSD = m.rewardValue / earnRedeem.redeemRate;

      // one_time missions amortized over 6 months; weekly missions fire 4×/month
      const freqMult = m.frequency === 'weekly' ? 4 : m.frequency === 'monthly' ? 1 : 1 / 6;
      missionCostUSD += players * MISSION_COMPLETION * rewardUSD * freqMult;
    }
  }

  // ── Totals ──
  const monthlyCostUSD = redemptionCostUSD + tierRewardCostUSD + missionCostUSD;
  const ggrMonthly     = players * arpu;
  const costRatioPct   = ggrMonthly > 0 ? (monthlyCostUSD / ggrMonthly) * 100 : 0;

  // ── Retention impact ──
  const liftFraction        = calcRetentionLift(cfg);
  const retentionLiftPct    = liftFraction * 100;
  const monthlyLiftRevenue  = ggrMonthly * liftFraction;
  const additionalRevenue3m = monthlyLiftRevenue * 3;
  const roi3m               = monthlyCostUSD > 0 ? additionalRevenue3m / (monthlyCostUSD * 3) : 0;

  // breakEvenMonths: how many months until cumulative lift covers 3× program cost
  const breakEvenMonths = monthlyLiftRevenue > 0
    ? Math.min(36, (3 * monthlyCostUSD) / monthlyLiftRevenue)
    : 36;

  return {
    avgEarnedPointsPerPlayer,
    avgRedeemedPointsPerPlayer,
    pointRedemptionRate: REDEMPTION_RATE,
    liabilityPerPlayer,
    totalLiabilityUSD,
    monthlyCostUSD,
    missionCostUSD,
    tierRewardCostUSD,
    costRatioPct,
    retentionLiftPct,
    additionalRevenue3m,
    breakEvenMonths,
    roi3m,
  };
}
