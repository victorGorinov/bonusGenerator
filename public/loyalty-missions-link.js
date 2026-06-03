// loyalty-missions-link.js — JS mirror of src/domain/loyalty/linkMissions.ts
// Must stay byte-for-byte equivalent to the TypeScript source.
// Parity verified by tests/domain/loyalty.missionLink.parity.test.js

export const FS_TO_POINTS = 10;

export const FREQ_PER_MONTH = { one_time: 0, weekly: 4.33, monthly: 1 };

export const BOOST_BY_OBJECTIVE = {
  wager:            0.25,
  consecutive_days: 0.20,
  sessions:         0.15,
  deposit:          0.10,
};

const BOOST_DURATION_BY_FREQ = { weekly: 7, monthly: 30, one_time: 14 };

const HIGH_VALUE_TIERS = ['gold', 'platinum', 'diamond'];
const ALL_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const HIGH_VALUE_WAGER_MULT = 5;

function _tierPointsContribution(m, earnRateDeposit) {
  if (m.rewardType === 'points') return m.rewardValue;
  if (m.rewardType === 'free_spins') return m.rewardValue * FS_TO_POINTS;
  return Math.round(m.rewardValue * earnRateDeposit);
}

function _eligibleTiers(m, tiers, earnRateDeposit) {
  const tierNames = tiers.map(t => t.name);
  if (m.objective === 'wager' && m.target > HIGH_VALUE_WAGER_MULT * earnRateDeposit) {
    const gold = tiers.find(t => t.name === 'gold');
    if (gold && gold.minPoints > 0) {
      return HIGH_VALUE_TIERS.filter(n => tierNames.includes(n));
    }
  }
  return ALL_TIERS.filter(n => tierNames.includes(n));
}

function _buildLink(m, tiers, params) {
  const pts   = _tierPointsContribution(m, params.earnRateDeposit);
  const moPts = Math.round(pts * (FREQ_PER_MONTH[m.frequency] ?? 0));
  const boost = Math.min(0.5, BOOST_BY_OBJECTIVE[m.objective] ?? 0.10);
  return {
    tierPointsContribution: pts,
    monthlyTierPoints:      moPts,
    multiplierBoost:        boost,
    boostDurationDays:      BOOST_DURATION_BY_FREQ[m.frequency] ?? 14,
    eligibleTiers:          _eligibleTiers(m, tiers, params.earnRateDeposit),
    acceleratesUpgrade:     moPts > 0,
  };
}

export function linkMissionsToTiers(missions, tiers, params) {
  return missions.map(m => ({ ...m, link: _buildLink(m, tiers, params) }));
}

if (typeof window !== 'undefined') {
  window._loyaltyMissionsLink = { linkMissionsToTiers, FS_TO_POINTS, FREQ_PER_MONTH, BOOST_BY_OBJECTIVE };
}
