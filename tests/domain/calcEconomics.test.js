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
    expect(result).toHaveProperty('participantsMid');
    expect(result).toHaveProperty('ggrLiftMid');
    expect(result).toHaveProperty('prizePoolCost');
    expect(result).toHaveProperty('netMarginMid');
    expect(result).toHaveProperty('roi');
  });

  it('arpu = 65 for EU', () => expect(result.arpu).toBe(65));
  it('eligible = 5000 for segment=all', () => expect(result.eligible).toBe(5000));
  it('participantsMid = 10% of eligible', () => expect(result.participantsMid).toBe(500));
  it('participantsLow < participantsMid < participantsHigh', () => {
    expect(result.participantsLow).toBeLessThan(result.participantsMid);
    expect(result.participantsMid).toBeLessThan(result.participantsHigh);
  });
  it('ggrLiftMid > 0', () => expect(result.ggrLiftMid).toBeGreaterThan(0));
  it('prizePoolCost = prizePool for fixed model', () => expect(result.prizePoolCost).toBe(1000));
  it('netMarginMid = ggrLiftMid - prizePoolCost', () => {
    expect(result.netMarginMid).toBe(result.ggrLiftMid - result.prizePoolCost);
  });
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

describe('calcTournamentEconomics — segments', () => {
  it('vip segment: eligible = 500', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'vip', duration: 'weekly', prizePool: 1000, poolModel: 'fixed',
    });
    expect(res.eligible).toBe(500);
  });

  it('dormant segment: eligible = 2000', () => {
    const res = calcTournamentEconomics({
      region: 'eu', segment: 'dormant', duration: 'weekly', prizePool: 1000, poolModel: 'fixed',
    });
    expect(res.eligible).toBe(2000);
  });
});

describe('calcTournamentEconomics — durations', () => {
  it('flash < daily in ggrLiftMid', () => {
    const flash  = calcTournamentEconomics({ region: 'eu', segment: 'all', duration: 'flash',  prizePool: 1000, poolModel: 'fixed' });
    const daily  = calcTournamentEconomics({ region: 'eu', segment: 'all', duration: 'daily',  prizePool: 1000, poolModel: 'fixed' });
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
