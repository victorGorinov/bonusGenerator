import { describe, it, expect } from 'vitest';
import { campaignFromAI, tournamentFromAI } from '../../public/retention-calendar/ai-to-campaign.js';

const CAMPAIGN_RESULT = {
  mechanic:     'reload',
  mechanicType: 'reload',
  econ:         { bpct: 50, arpu: 65 },
};

const TOURNAMENT_RESULT = {
  spec:   { type: 'slot', scoring: 'total_wins', prizePool: 5000 },
  econ:   { roi: 120, eligible: 550 },
  params: { geo: 'de', segment: 'all', duration: 'weekly' },
  cur:    'EUR',
  region: 'eu',
};

describe('campaignFromAI', () => {
  it('maps mechanic to correct type', () => {
    const c = campaignFromAI(CAMPAIGN_RESULT, { geo: 'de', segment: 'vip' });
    expect(c.type).toBe('reload');
  });

  it('sets segment and geo from params', () => {
    const c = campaignFromAI(CAMPAIGN_RESULT, { geo: 'kz', segment: 'dormant' });
    expect(c.segment).toBe('dormant');
    expect(c.geo).toBe('kz');
  });

  it('sets status to draft', () => {
    const c = campaignFromAI(CAMPAIGN_RESULT, { geo: 'de', segment: 'all' });
    expect(c.status).toBe('draft');
  });

  it('sets sourceType to campaign_generator', () => {
    const c = campaignFromAI(CAMPAIGN_RESULT, { geo: 'de', segment: 'all' });
    expect(c.sourceType).toBe('campaign_generator');
  });

  it('generates future startDate', () => {
    const c = campaignFromAI(CAMPAIGN_RESULT, { geo: 'de', segment: 'all' });
    expect(c.startDate >= new Date().toISOString().slice(0, 10)).toBe(true);
  });

  it('endDate is after startDate', () => {
    const c = campaignFromAI(CAMPAIGN_RESULT, { geo: 'de', segment: 'all' });
    expect(c.endDate > c.startDate).toBe(true);
  });

  it('unknown mechanic maps to custom type', () => {
    const c = campaignFromAI({ mechanic: 'unknown_mechanic' }, { geo: 'de', segment: 'all' });
    expect(c.type).toBe('custom');
  });
});

describe('tournamentFromAI', () => {
  it('sets type to tournament', () => {
    const c = tournamentFromAI(TOURNAMENT_RESULT);
    expect(c.type).toBe('tournament');
  });

  it('sets geo from params', () => {
    const c = tournamentFromAI(TOURNAMENT_RESULT);
    expect(c.geo).toBe('de');
  });

  it('sets status to draft', () => {
    const c = tournamentFromAI(TOURNAMENT_RESULT);
    expect(c.status).toBe('draft');
  });

  it('sets sourceType to tournament_generator', () => {
    const c = tournamentFromAI(TOURNAMENT_RESULT);
    expect(c.sourceType).toBe('tournament_generator');
  });

  it('endDate reflects weekly duration (7 days span)', () => {
    const c = tournamentFromAI(TOURNAMENT_RESULT);
    const diff = (new Date(c.endDate) - new Date(c.startDate)) / 86400000;
    expect(diff).toBe(6); // startDate + 6 = 7-day span
  });

  it('stores prizePool in rewards', () => {
    const c = tournamentFromAI(TOURNAMENT_RESULT);
    expect(c.rewards?.prizePool).toBe(5000);
  });
});
