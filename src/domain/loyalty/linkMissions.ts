import type {
  Mission, MissionTierLink, LoyaltyTier, LoyaltyBuildParams,
  MissionObjective, MissionFrequency, TierName,
} from './types.js';

export const FS_TO_POINTS = 10; // free spin → tier points conversion rate

export const FREQ_PER_MONTH: Record<MissionFrequency, number> = {
  one_time: 0,    // no steady-state monthly contribution
  weekly:   4.33, // ~4.33 weeks per month
  monthly:  1,
};

export const BOOST_BY_OBJECTIVE: Record<MissionObjective, number> = {
  wager:            0.25,
  consecutive_days: 0.20,
  sessions:         0.15,
  deposit:          0.10,
};

const BOOST_DURATION_BY_FREQ: Record<MissionFrequency, number> = {
  weekly:   7,
  monthly:  30,
  one_time: 14,
};

// Tiers at or above the gold level (high-value missions are restricted here)
const HIGH_VALUE_TIERS: TierName[] = ['gold', 'platinum', 'diamond'];
const ALL_TIERS: TierName[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

// High-value wager threshold: missions with wager objective and scaled target
// above this multiplier of the earnRateDeposit are restricted to gold+
const HIGH_VALUE_WAGER_MULT = 5;

function tierPointsContribution(m: Mission, earnRateDeposit: number): number {
  if (m.rewardType === 'points') return m.rewardValue;
  if (m.rewardType === 'free_spins') return m.rewardValue * FS_TO_POINTS;
  // cash_bonus: convert via earnRateDeposit (dollars → points at deposit earn rate)
  return Math.round(m.rewardValue * earnRateDeposit);
}

function eligibleTiers(m: Mission, tiers: LoyaltyTier[], earnRateDeposit: number): TierName[] {
  const tierNames = tiers.map(t => t.name);
  // Restrict high-value wager missions to gold+ based on minPoints threshold
  if (m.objective === 'wager' && m.target > HIGH_VALUE_WAGER_MULT * earnRateDeposit) {
    const goldMinPoints = tiers.find(t => t.name === 'gold')?.minPoints ?? 0;
    if (goldMinPoints > 0) {
      return HIGH_VALUE_TIERS.filter(n => tierNames.includes(n));
    }
  }
  return ALL_TIERS.filter(n => tierNames.includes(n));
}

function buildLink(m: Mission, tiers: LoyaltyTier[], params: LoyaltyBuildParams): MissionTierLink {
  const pts    = tierPointsContribution(m, params.earnRateDeposit);
  const moPts  = Math.round(pts * FREQ_PER_MONTH[m.frequency]);
  const boost  = Math.min(0.5, BOOST_BY_OBJECTIVE[m.objective] ?? 0.10);

  return {
    tierPointsContribution: pts,
    monthlyTierPoints:      moPts,
    multiplierBoost:        boost,
    boostDurationDays:      BOOST_DURATION_BY_FREQ[m.frequency] ?? 14,
    eligibleTiers:          eligibleTiers(m, tiers, params.earnRateDeposit),
    acceleratesUpgrade:     moPts > 0,
  };
}

export function linkMissionsToTiers(
  missions: Mission[],
  tiers:    LoyaltyTier[],
  params:   LoyaltyBuildParams,
): Mission[] {
  return missions.map(m => ({ ...m, link: buildLink(m, tiers, params) }));
}
