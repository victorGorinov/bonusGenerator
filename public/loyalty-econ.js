// Client-side port of loyalty domain functions.
// Keep in sync with src/domain/loyalty/{buildConfig,retentionLift,calcEconomics}.ts

import { linkMissionsToTiers } from './loyalty-missions-link.js';

// ── buildLoyaltyConfig ────────────────────────────────────────────────────────

const TIER_DEFS = [
  { name: 'bronze',   label: 'Bronze',   thresholdMonths: 0,  multiplier: 1.00, freeSpinsMonthly: 0,  depositBonusPct: 0.00 },
  { name: 'silver',   label: 'Silver',   thresholdMonths: 1,  multiplier: 1.25, freeSpinsMonthly: 5,  depositBonusPct: 0.05 },
  { name: 'gold',     label: 'Gold',     thresholdMonths: 3,  multiplier: 1.50, freeSpinsMonthly: 15, depositBonusPct: 0.10 },
  { name: 'platinum', label: 'Platinum', thresholdMonths: 8,  multiplier: 2.00, freeSpinsMonthly: 30, depositBonusPct: 0.15 },
  { name: 'diamond',  label: 'Diamond',  thresholdMonths: 20, multiplier: 2.50, freeSpinsMonthly: 50, depositBonusPct: 0.20 },
];

const MISSION_TEMPLATES = [
  { name: 'First Deposits',    objective: 'deposit',          targetBase: 3,    rewardType: 'points',     rewardBase: 500,  frequency: 'one_time', scaleTarget: false, scaleReward: true  },
  { name: 'Monthly Depositor', objective: 'deposit',          targetBase: 1,    rewardType: 'points',     rewardBase: 200,  frequency: 'monthly',  scaleTarget: false, scaleReward: true  },
  { name: 'High Roller Week',  objective: 'wager',            targetBase: 500,  rewardType: 'free_spins', rewardBase: 20,   frequency: 'weekly',   scaleTarget: true,  scaleReward: false },
  { name: 'Weekly Sessions',   objective: 'sessions',         targetBase: 5,    rewardType: 'points',     rewardBase: 300,  frequency: 'weekly',   scaleTarget: false, scaleReward: true  },
  { name: '7-Day Streak',      objective: 'consecutive_days', targetBase: 7,    rewardType: 'cash_bonus', rewardBase: 5,    frequency: 'weekly',   scaleTarget: false, scaleReward: true  },
  { name: 'Monthly Grinder',   objective: 'wager',            targetBase: 2000, rewardType: 'points',     rewardBase: 1000, frequency: 'monthly',  scaleTarget: true,  scaleReward: true  },
];

function _buildTiers(params) {
  const defs = TIER_DEFS.slice(0, params.numTiers);
  const n    = params.numTiers;
  const monthlyBase = params.avgdep * params.earnRateDeposit;
  return defs.map((def, i) => ({
    name:             def.name,
    label:            def.label,
    minPoints:        Math.round(def.thresholdMonths * monthlyBase),
    bonusMultiplier:  def.multiplier,
    cashbackRate:     n > 1 ? (i / (n - 1)) * params.topCashbackRate : params.topCashbackRate,
    freeSpinsMonthly: def.freeSpinsMonthly,
    depositBonusPct:  def.depositBonusPct,
    maxBonus:         Math.round(params.avgdep * def.depositBonusPct * 5),
  }));
}

function _buildMissions(params) {
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

export function buildLoyaltyConfig(params) {
  const hasMissions  = params.mode !== 'tiers' && params.missionCount > 0;
  const rawMissions  = hasMissions ? _buildMissions(params) : [];
  const tiers        = _buildTiers(params);
  const missions     = params.mode === 'hybrid' && rawMissions.length > 0
    ? linkMissionsToTiers(rawMissions, tiers, params)
    : rawMissions;
  return {
    mode:       params.mode,
    tiers,
    earnRedeem: {
      earnRateDeposit: params.earnRateDeposit,
      earnRateWager:   params.earnRateWager,
      redeemRate:      params.redeemRate,
      redeemMinPoints: params.redeemMinPoints,
      pointsExpiry:    params.pointsExpiry,
    },
    missions,
    hasMissions,
    region:  params.region,
    segment: params.segment,
    players: params.players,
    avgdep:  params.avgdep,
    arpu:    params.arpu,
  };
}

// ── calcRetentionLift ─────────────────────────────────────────────────────────

const SEG_BASE = { new: 0.08, mid: 0.12, vip: 0.18 };
const MODE_MULT = { tiers: 0.85, missions: 0.90, hybrid: 1.00 };
const TIER_DEPTH_MULT = { 3: 0.85, 4: 0.95, 5: 1.00 };

function _earnFactor(earnRateDeposit) {
  return Math.min(1.10, 0.90 + earnRateDeposit / 100);
}

function _synergyFactor(cfg) {
  if (cfg.mode !== 'hybrid') return 1;
  const monthlyEarnBaseline = cfg.avgdep * cfg.earnRedeem.earnRateDeposit;
  if (monthlyEarnBaseline <= 0) return 1;
  const totalMonthlyMissionPts = (cfg.missions || []).reduce((acc, m) => {
    return acc + (m.link ? m.link.monthlyTierPoints : 0);
  }, 0);
  const tierAccel = Math.min(0.5, totalMonthlyMissionPts / monthlyEarnBaseline);
  return 1 + 0.20 * tierAccel;
}

export function calcRetentionLift(cfg) {
  const base     = SEG_BASE[cfg.segment] ?? SEG_BASE['mid'];
  const modeMult = MODE_MULT[cfg.mode] ?? 1.00;
  const tierMult = TIER_DEPTH_MULT[cfg.tiers.length] ?? 1.00;
  const earn     = _earnFactor(cfg.earnRedeem.earnRateDeposit);
  const synergy  = _synergyFactor(cfg);
  return Math.min(0.35, base * modeMult * tierMult * earn * synergy);
}

// ── calcLoyaltyEconomics ──────────────────────────────────────────────────────

const WAGER_MULTIPLIER   = 5;
const REDEMPTION_RATE    = 0.40;
const FS_VALUE_USD       = 0.10;
const MISSION_COMPLETION = 0.35;

const TIER_DIST = [
  { bronze: 0.50, silver: 0.32, gold: 0.18, platinum: 0, diamond: 0 },
  { bronze: 0.50, silver: 0.25, gold: 0.15, platinum: 0.10, diamond: 0 },
  { bronze: 0.50, silver: 0.25, gold: 0.15, platinum: 0.07, diamond: 0.03 },
];

export function calcLoyaltyEconomics(cfg) {
  const { players, avgdep, arpu, tiers, earnRedeem, missions, hasMissions } = cfg;

  const depositPts               = avgdep * earnRedeem.earnRateDeposit;
  const wagerPts                 = avgdep * WAGER_MULTIPLIER * earnRedeem.earnRateWager;
  const avgEarnedPointsPerPlayer = depositPts + wagerPts;

  const avgRedeemedPointsPerPlayer = avgEarnedPointsPerPlayer * REDEMPTION_RATE;
  const redemptionValuePerPlayer   = avgRedeemedPointsPerPlayer / earnRedeem.redeemRate;
  const redemptionCostUSD          = players * redemptionValuePerPlayer;

  const liabilityPts       = avgEarnedPointsPerPlayer * (1 - REDEMPTION_RATE);
  const liabilityPerPlayer = liabilityPts / earnRedeem.redeemRate;
  const totalLiabilityUSD  = players * liabilityPerPlayer;

  const distIdx = Math.min(tiers.length - 3, 2);
  const dist    = TIER_DIST[distIdx] ?? TIER_DIST[2];

  let tierRewardCostUSD = 0;
  for (const tier of tiers) {
    const share = dist[tier.name] ?? 0;
    const n     = players * share;
    tierRewardCostUSD += n * tier.cashbackRate * arpu;
    tierRewardCostUSD += n * tier.freeSpinsMonthly * FS_VALUE_USD;
  }

  let missionCostUSD = 0;
  if (hasMissions) {
    for (const m of missions) {
      let rewardUSD;
      if      (m.rewardType === 'cash_bonus')  rewardUSD = m.rewardValue;
      else if (m.rewardType === 'free_spins')  rewardUSD = m.rewardValue * FS_VALUE_USD;
      else                                     rewardUSD = m.rewardValue / earnRedeem.redeemRate;

      const freqMult = m.frequency === 'weekly' ? 4 : m.frequency === 'monthly' ? 1 : 1 / 6;
      missionCostUSD += players * MISSION_COMPLETION * rewardUSD * freqMult;
    }
  }

  const monthlyCostUSD = redemptionCostUSD + tierRewardCostUSD + missionCostUSD;
  const ggrMonthly     = players * arpu;
  const costRatioPct   = ggrMonthly > 0 ? (monthlyCostUSD / ggrMonthly) * 100 : 0;

  const liftFraction        = calcRetentionLift(cfg);
  const retentionLiftPct    = liftFraction * 100;
  const monthlyLiftRevenue  = ggrMonthly * liftFraction;
  const additionalRevenue3m = monthlyLiftRevenue * 3;
  const roi3m               = monthlyCostUSD > 0 ? additionalRevenue3m / (monthlyCostUSD * 3) : 0;

  const breakEvenMonths = monthlyLiftRevenue >= monthlyCostUSD
    ? monthlyCostUSD / (monthlyLiftRevenue - monthlyCostUSD)
    : null;

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

// ── Main export ───────────────────────────────────────────────────────────────

export function recalcEconLocal(draft) {
  const config = buildLoyaltyConfig(draft);
  const econ   = calcLoyaltyEconomics(config);
  return { config, econ };
}

// Expose to global scope for non-module scripts
if (typeof window !== 'undefined') {
  window._loyaltyEcon = { buildLoyaltyConfig, calcRetentionLift, calcLoyaltyEconomics, recalcEconLocal };
}
