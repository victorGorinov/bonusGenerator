import { describe, it, expect } from 'vitest';
import { linkMissionsToTiers, FS_TO_POINTS, FREQ_PER_MONTH, BOOST_BY_OBJECTIVE } from '../../src/domain/loyalty/linkMissions.js';

const BASE_PARAMS = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 3,
  region: 'eu',
  segment: 'mid',
  players: 5000,
  avgdep: 100,
  arpu: 50,
};

const BASE_TIERS = [
  { name: 'bronze',   minPoints: 0 },
  { name: 'silver',   minPoints: 1000 },
  { name: 'gold',     minPoints: 3000 },
  { name: 'platinum', minPoints: 8000 },
  { name: 'diamond',  minPoints: 20000 },
];

function makeMission(overrides) {
  return {
    id: 'm1', name: 'Test', objective: 'wager', target: 100,
    rewardType: 'points', rewardValue: 500, frequency: 'weekly',
    ...overrides,
  };
}

describe('linkMissionsToTiers — constants', () => {
  it('FS_TO_POINTS is 10', () => expect(FS_TO_POINTS).toBe(10));
  it('FREQ_PER_MONTH.one_time is 0', () => expect(FREQ_PER_MONTH.one_time).toBe(0));
  it('FREQ_PER_MONTH.weekly is 4.33', () => expect(FREQ_PER_MONTH.weekly).toBe(4.33));
  it('FREQ_PER_MONTH.monthly is 1', () => expect(FREQ_PER_MONTH.monthly).toBe(1));
  it('BOOST_BY_OBJECTIVE.wager is 0.25', () => expect(BOOST_BY_OBJECTIVE.wager).toBe(0.25));
  it('BOOST_BY_OBJECTIVE.consecutive_days is 0.20', () => expect(BOOST_BY_OBJECTIVE.consecutive_days).toBe(0.20));
  it('BOOST_BY_OBJECTIVE.sessions is 0.15', () => expect(BOOST_BY_OBJECTIVE.sessions).toBe(0.15));
  it('BOOST_BY_OBJECTIVE.deposit is 0.10', () => expect(BOOST_BY_OBJECTIVE.deposit).toBe(0.10));
});

describe('linkMissionsToTiers — rewardType → tierPointsContribution', () => {
  it('points: tierPointsContribution = rewardValue directly', () => {
    const [m] = linkMissionsToTiers([makeMission({ rewardType: 'points', rewardValue: 500 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.tierPointsContribution).toBe(500);
  });

  it('free_spins: tierPointsContribution = rewardValue × FS_TO_POINTS', () => {
    const [m] = linkMissionsToTiers([makeMission({ rewardType: 'free_spins', rewardValue: 20 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.tierPointsContribution).toBe(20 * FS_TO_POINTS);
  });

  it('cash_bonus: tierPointsContribution = rewardValue × earnRateDeposit', () => {
    const params = { ...BASE_PARAMS, earnRateDeposit: 10 };
    const [m] = linkMissionsToTiers([makeMission({ rewardType: 'cash_bonus', rewardValue: 5 })], BASE_TIERS, params);
    expect(m.link.tierPointsContribution).toBe(5 * 10);
  });
});

describe('linkMissionsToTiers — monthlyTierPoints', () => {
  it('one_time: monthlyTierPoints === 0', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'one_time', rewardType: 'points', rewardValue: 500 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.monthlyTierPoints).toBe(0);
  });

  it('weekly: monthlyTierPoints = tierPointsContribution × 4.33', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'weekly', rewardType: 'points', rewardValue: 300 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.monthlyTierPoints).toBe(Math.round(300 * 4.33));
  });

  it('monthly: monthlyTierPoints = tierPointsContribution × 1', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'monthly', rewardType: 'points', rewardValue: 1000 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.monthlyTierPoints).toBe(1000);
  });
});

describe('linkMissionsToTiers — multiplierBoost + boostDurationDays', () => {
  it('wager → multiplierBoost 0.25, weekly → boostDurationDays 7', () => {
    const [m] = linkMissionsToTiers([makeMission({ objective: 'wager', frequency: 'weekly' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.multiplierBoost).toBe(0.25);
    expect(m.link.boostDurationDays).toBe(7);
  });

  it('consecutive_days → multiplierBoost 0.20', () => {
    const [m] = linkMissionsToTiers([makeMission({ objective: 'consecutive_days' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.multiplierBoost).toBe(0.20);
  });

  it('sessions → multiplierBoost 0.15', () => {
    const [m] = linkMissionsToTiers([makeMission({ objective: 'sessions' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.multiplierBoost).toBe(0.15);
  });

  it('deposit → multiplierBoost 0.10', () => {
    const [m] = linkMissionsToTiers([makeMission({ objective: 'deposit' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.multiplierBoost).toBe(0.10);
  });

  it('monthly → boostDurationDays 30', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'monthly' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.boostDurationDays).toBe(30);
  });

  it('one_time → boostDurationDays 14', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'one_time' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.boostDurationDays).toBe(14);
  });

  it('multiplierBoost is capped at 0.5', () => {
    // Even if BOOST_BY_OBJECTIVE were to exceed 0.5, cap holds
    const [m] = linkMissionsToTiers([makeMission({ objective: 'wager' })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.multiplierBoost).toBeLessThanOrEqual(0.5);
  });
});

describe('linkMissionsToTiers — eligibleTiers', () => {
  it('low-value mission: eligible on all tiers', () => {
    // target 10 wager vs HIGH_VALUE_WAGER_MULT(5) × earnRateDeposit(10) = 50 → not high-value
    const [m] = linkMissionsToTiers([makeMission({ objective: 'wager', target: 10 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.eligibleTiers).toContain('bronze');
    expect(m.link.eligibleTiers).toContain('silver');
    expect(m.link.eligibleTiers).toContain('gold');
  });

  it('high-value wager mission: restricted to gold+', () => {
    // target 5000 wager vs 5 × 10 = 50 → high value
    const [m] = linkMissionsToTiers([makeMission({ objective: 'wager', target: 5000 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.eligibleTiers).not.toContain('bronze');
    expect(m.link.eligibleTiers).not.toContain('silver');
    expect(m.link.eligibleTiers).toContain('gold');
    expect(m.link.eligibleTiers).toContain('platinum');
    expect(m.link.eligibleTiers).toContain('diamond');
  });

  it('high-value non-wager mission: still all tiers', () => {
    const [m] = linkMissionsToTiers([makeMission({ objective: 'deposit', target: 9999 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.eligibleTiers).toContain('bronze');
  });

  it('eligible tiers filtered to tiers that exist in config', () => {
    const tiers3 = BASE_TIERS.slice(0, 3); // bronze, silver, gold
    const [m] = linkMissionsToTiers([makeMission({ objective: 'wager', target: 10 })], tiers3, BASE_PARAMS);
    expect(m.link.eligibleTiers).toEqual(['bronze', 'silver', 'gold']);
  });
});

describe('linkMissionsToTiers — acceleratesUpgrade', () => {
  it('weekly mission: acceleratesUpgrade is true', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'weekly', rewardType: 'points', rewardValue: 300 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.acceleratesUpgrade).toBe(true);
  });

  it('one_time mission: acceleratesUpgrade is false (monthlyTierPoints === 0)', () => {
    const [m] = linkMissionsToTiers([makeMission({ frequency: 'one_time', rewardType: 'points', rewardValue: 300 })], BASE_TIERS, BASE_PARAMS);
    expect(m.link.monthlyTierPoints).toBe(0);
    expect(m.link.acceleratesUpgrade).toBe(false);
  });
});

describe('linkMissionsToTiers — preserves original mission fields', () => {
  it('id, name, objective, target, rewardType, rewardValue, frequency unchanged', () => {
    const original = makeMission({ id: 'mx7', name: 'Grind', objective: 'sessions', target: 42, rewardType: 'free_spins', rewardValue: 15, frequency: 'monthly' });
    const [m] = linkMissionsToTiers([original], BASE_TIERS, BASE_PARAMS);
    expect(m.id).toBe('mx7');
    expect(m.name).toBe('Grind');
    expect(m.objective).toBe('sessions');
    expect(m.target).toBe(42);
    expect(m.rewardType).toBe('free_spins');
    expect(m.rewardValue).toBe(15);
    expect(m.frequency).toBe('monthly');
  });
});
