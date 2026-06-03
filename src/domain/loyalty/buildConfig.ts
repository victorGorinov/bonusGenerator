import type {
  LoyaltyBuildParams, LoyaltyConfig, LoyaltyTier, EarnRedeemConfig, Mission,
  TierName, MissionObjective, MissionRewardType, MissionFrequency,
} from './types.js';
import { linkMissionsToTiers } from './linkMissions.js';

// Static tier ladder: always 5 definitions; numTiers slices from index 0
const TIER_DEFS: Array<{
  name: TierName; label: string; thresholdMonths: number;
  multiplier: number; freeSpinsMonthly: number; depositBonusPct: number;
}> = [
  { name: 'bronze',   label: 'Bronze',   thresholdMonths: 0,  multiplier: 1.00, freeSpinsMonthly: 0,  depositBonusPct: 0.00 },
  { name: 'silver',   label: 'Silver',   thresholdMonths: 1,  multiplier: 1.25, freeSpinsMonthly: 5,  depositBonusPct: 0.05 },
  { name: 'gold',     label: 'Gold',     thresholdMonths: 3,  multiplier: 1.50, freeSpinsMonthly: 15, depositBonusPct: 0.10 },
  { name: 'platinum', label: 'Platinum', thresholdMonths: 8,  multiplier: 2.00, freeSpinsMonthly: 30, depositBonusPct: 0.15 },
  { name: 'diamond',  label: 'Diamond',  thresholdMonths: 20, multiplier: 2.50, freeSpinsMonthly: 50, depositBonusPct: 0.20 },
];

const MISSION_TEMPLATES: Array<{
  name: string; objective: MissionObjective; targetBase: number;
  rewardType: MissionRewardType; rewardBase: number; frequency: MissionFrequency;
  scaleTarget: boolean; scaleReward: boolean;
}> = [
  { name: 'First Deposits',    objective: 'deposit',          targetBase: 3,    rewardType: 'points',     rewardBase: 500,  frequency: 'one_time', scaleTarget: false, scaleReward: true  },
  { name: 'Monthly Depositor', objective: 'deposit',          targetBase: 1,    rewardType: 'points',     rewardBase: 200,  frequency: 'monthly',  scaleTarget: false, scaleReward: true  },
  { name: 'High Roller Week',  objective: 'wager',            targetBase: 500,  rewardType: 'free_spins', rewardBase: 20,   frequency: 'weekly',   scaleTarget: true,  scaleReward: false },
  { name: 'Weekly Sessions',   objective: 'sessions',         targetBase: 5,    rewardType: 'points',     rewardBase: 300,  frequency: 'weekly',   scaleTarget: false, scaleReward: true  },
  { name: '7-Day Streak',      objective: 'consecutive_days', targetBase: 7,    rewardType: 'cash_bonus', rewardBase: 5,    frequency: 'weekly',   scaleTarget: false, scaleReward: true  },
  { name: 'Monthly Grinder',   objective: 'wager',            targetBase: 2000, rewardType: 'points',     rewardBase: 1000, frequency: 'monthly',  scaleTarget: true,  scaleReward: true  },
];

function buildTiers(params: LoyaltyBuildParams): LoyaltyTier[] {
  const defs = TIER_DEFS.slice(0, params.numTiers);
  const n    = params.numTiers;
  // Monthly earn baseline determines point thresholds
  const monthlyBase = params.avgdep * params.earnRateDeposit;

  return defs.map((def, i) => ({
    name:              def.name,
    label:             def.label,
    minPoints:         Math.round(def.thresholdMonths * monthlyBase),
    bonusMultiplier:   def.multiplier,
    cashbackRate:      n > 1 ? (i / (n - 1)) * params.topCashbackRate : params.topCashbackRate,
    freeSpinsMonthly:  def.freeSpinsMonthly,
    depositBonusPct:   def.depositBonusPct,
    maxBonus:          Math.round(params.avgdep * def.depositBonusPct * 5),
  }));
}

function buildMissions(params: LoyaltyBuildParams): Mission[] {
  if (params.missionCount === 0) return [];
  const scale = Math.max(0.5, params.avgdep / 100);

  return MISSION_TEMPLATES.slice(0, params.missionCount).map((tpl, i) => ({
    id:          `m${i + 1}`,
    name:        tpl.name,
    objective:   tpl.objective,
    target:      Math.round(tpl.targetBase * (tpl.scaleTarget ? scale : 1)),
    rewardType:  tpl.rewardType,
    rewardValue: Math.round(tpl.rewardBase * (tpl.scaleReward ? scale : 1)),
    frequency:   tpl.frequency,
  }));
}

export function buildLoyaltyConfig(params: LoyaltyBuildParams): LoyaltyConfig {
  const hasMissions = params.mode !== 'tiers' && params.missionCount > 0;
  const rawMissions = hasMissions ? buildMissions(params) : [];
  const tiers       = buildTiers(params);
  const missions    = params.mode === 'hybrid' && rawMissions.length > 0
    ? linkMissionsToTiers(rawMissions, tiers, params)
    : rawMissions;

  const earnRedeem: EarnRedeemConfig = {
    earnRateDeposit: params.earnRateDeposit,
    earnRateWager:   params.earnRateWager,
    redeemRate:      params.redeemRate,
    redeemMinPoints: params.redeemMinPoints,
    pointsExpiry:    params.pointsExpiry,
  };

  return {
    mode:        params.mode,
    tiers,
    earnRedeem,
    missions,
    hasMissions,
    region:      params.region,
    segment:     params.segment,
    players:     params.players,
    avgdep:      params.avgdep,
    arpu:        params.arpu,
  };
}
