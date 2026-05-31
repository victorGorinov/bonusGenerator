import { describe, it, expect } from 'vitest';
import { calcTournamentEconomics } from '../../src/domain/tournament/calcEconomics.js';

describe('calcTournamentEconomics — defaults (EU, weekly, fixed)', () => {
  const result = calcTournamentEconomics({
    region: 'eu', segment: 'all', duration: 'weekly',
    prizePool: 1000, poolModel: 'fixed',
  });

  it('returns all required fields', () => {
    expect(result).toHaveProperty('arpu');
    expect(result).toHaveProperty('eligible');
    expect(result).toHaveProperty('totalPlayers');
    expect(result).toHaveProperty('segmentRatio');
    expect(result).toHaveProperty('participantsMid');
    expect(result).toHaveProperty('ggrLiftMid');
    expect(result).toHaveProperty('prizePoolCost');
    expect(result).toHaveProperty('netMarginMid');
    expect(result).toHaveProperty('retentionValue');
    expect(result).toHaveProperty('totalValueMid');
    expect(result).toHaveProperty('engagementMultiplier');
    expect(result).toHaveProperty('roi');
  });

  it('arpu = 65 for EU', () => expect(result.arpu).toBe(65));

  // backward compat: omitting totalPlayers defaults to 5000
  it('defaults totalPlayers = 5000 when omitted', () => expect(result.totalPlayers).toBe(5000));
  it('segmentRatio = 1.0 for segment=all', () => expect(result.segmentRatio).toBe(1.0));
  it('eligible = 5000 for segment=all, totalPlayers=5000', () => expect(result.eligible).toBe(5000));

  // weekly participation mid = 15% of 5000 = 750
  it('participantsMid = 15% of eligible for weekly', () => expect(result.participantsMid).toBe(750));
  it('participantsLow < participantsMid < participantsHigh', () => {
    expect(result.participantsLow).toBeLessThan(result.participantsMid);
    expect(result.participantsMid).toBeLessThan(result.participantsHigh);
  });

  it('engagementMultiplier = 2.5 for weekly', () => expect(result.engagementMultiplier).toBe(2.5));

  it('ggrLiftMid > 0', () => expect(result.ggrLiftMid).toBeGreaterThan(0));
  it('ggrLiftMid reflects engagement multiplier (substantially > prize pool for reasonable pool)', () => {
    expect(result.ggrLiftMid).toBeGreaterThan(result.prizePoolCost);
  });

  it('prizePoolCost = prizePool for fixed model', () => expect(result.prizePoolCost).toBe(1000));
  it('netMarginMid = ggrLiftMid - prizePoolCost', () => {
    expect(result.netMarginMid).toBe(result.ggrLiftMid - result.prizePoolCost);
  });
  it('retentionValue > 0', () => expect(result.retentionValue).toBeGreaterThan(0));
  it('totalValueMid = netMarginMid + retentionValue', () => {
    expect(result.totalValueMid).toBe(result.netMarginMid + result.retentionValue);
  });
  it('roi > 0 for reasonable prize pool', () => expect(result.roi).toBeGreaterThan(0));
  it('costPerActiveMid = prizePoolCost / participantsMid', () => {
    expect(result.costPerActiveMid).toBe(Math.round(result.prizePoolCost / result.participantsMid));
  });
  it('breakEvenParticipants > 0', () => expect(result.breakEvenParticipants).toBeGreaterThan(0));
});

describe('calcTournamentEconomics — poolModel variants', () => {
  it('dynamic: prizePoolCost < prizePool when rake > 0', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'all', duration: 'weekly',
      prizePool: 1000, poolModel: 'dynamic', rake: 10,
    });
    expect(res.prizePoolCost).toBe(900);
  });

  it('hybrid: prizePoolCost = prizePool * 0.6', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'all', duration: 'weekly',
      prizePool: 1000, poolModel: 'hybrid',
    });
    expect(res.prizePoolCost).toBe(600);
  });

  it('dynamic with 0 rake: prizePoolCost = prizePool', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'all', duration: 'weekly',
      prizePool: 1000, poolModel: 'dynamic', rake: 0,
    });
    expect(res.prizePoolCost).toBe(1000);
  });
});

describe('calcTournamentEconomics — totalPlayers + segmentRatio', () => {
  it('derives eligible from totalPlayers × segmentRatio (vip)', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'vip', duration: 'weekly',
      prizePool: 1000, poolModel: 'fixed',
      totalPlayers: 1000,
    });
    expect(res.eligible).toBe(100);       // 10% of 1000
    expect(res.segmentRatio).toBe(0.10);
    expect(res.totalPlayers).toBe(1000);
  });

  it('derives eligible for dormant (40%)', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'dormant', duration: 'weekly',
      prizePool: 1000, poolModel: 'fixed',
      totalPlayers: 10000,
    });
    expect(res.eligible).toBe(4000);      // 40% of 10000
    expect(res.segmentRatio).toBe(0.40);
  });

  it('derives eligible for depositors (60%)', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'depositors', duration: 'weekly',
      prizePool: 1000, poolModel: 'fixed',
      totalPlayers: 5000,
    });
    expect(res.eligible).toBe(3000);      // 60% of 5000
  });

  it('backward compat: omitting totalPlayers defaults to 5000', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'all', duration: 'weekly',
      prizePool: 1000, poolModel: 'fixed',
    });
    expect(res.eligible).toBe(5000);
    expect(res.totalPlayers).toBe(5000);
  });

  it('large casino: totalPlayers=50000, segment=new → eligible=10000', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'new', duration: 'weekly',
      prizePool: 1000, poolModel: 'fixed',
      totalPlayers: 50000,
    });
    expect(res.eligible).toBe(10000);     // 20% of 50000
  });
});

describe('calcTournamentEconomics — segments (backward compat with default totalPlayers=5000)', () => {
  it('vip segment: eligible = 500 (10% of 5000)', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'vip', duration: 'weekly', prizePool: 1000, poolModel: 'fixed',
    });
    expect(res.eligible).toBe(500);
  });

  it('dormant segment: eligible = 2000 (40% of 5000)', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'dormant', duration: 'weekly', prizePool: 1000, poolModel: 'fixed',
    });
    expect(res.eligible).toBe(2000);
  });
});

describe('calcTournamentEconomics — durations', () => {
  it('flash < daily in ggrLiftMid', () => {
    const flash = calcTournamentEconomics({ region: 'eu', segment: 'all', duration: 'flash',  prizePool: 1000, poolModel: 'fixed' });
    const daily = calcTournamentEconomics({ region: 'eu', segment: 'all', duration: 'daily',  prizePool: 1000, poolModel: 'fixed' });
    expect(flash.ggrLiftMid).toBeLessThan(daily.ggrLiftMid);
  });

  it('weekly < monthly in ggrLiftMid', () => {
    const weekly  = calcTournamentEconomics({ region: 'eu', segment: 'all', duration: 'weekly',  prizePool: 1000, poolModel: 'fixed' });
    const monthly = calcTournamentEconomics({ region: 'eu', segment: 'all', duration: 'monthly', prizePool: 1000, poolModel: 'fixed' });
    expect(weekly.ggrLiftMid).toBeLessThan(monthly.ggrLiftMid);
  });
});

describe('calcTournamentEconomics — regions', () => {
  it('cis arpu = 22', () => {
    const res = calcTournamentEconomics({ region: 'cis', segment: 'all', duration: 'weekly', prizePool: 1000, poolModel: 'fixed' });
    expect(res.arpu).toBe(22);
  });

  it('crypto arpu = 80', () => {
    const res = calcTournamentEconomics({ region: 'crypto', segment: 'all', duration: 'weekly', prizePool: 1000, poolModel: 'fixed' });
    expect(res.arpu).toBe(80);
  });

  it('higher arpu → higher ggrLiftMid (crypto > eu)', () => {
    const eu     = calcTournamentEconomics({ region: 'eu',     segment: 'all', duration: 'weekly', prizePool: 1000, poolModel: 'fixed' });
    const crypto = calcTournamentEconomics({ region: 'crypto', segment: 'all', duration: 'weekly', prizePool: 1000, poolModel: 'fixed' });
    expect(crypto.ggrLiftMid).toBeGreaterThan(eu.ggrLiftMid);
  });
});
