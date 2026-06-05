// Verifies campaign.service merges selection-aware econ: changing bonusTypes
// changes econ.costRatio / sP50.cost in the generateCampaign response.
import { describe, it, expect } from 'vitest';
import { generateCampaign }     from '../../src/services/campaign.service.js';

const base = { geo: 'de', segment: 'mid', games: 'slots', risk: 'low', lang: 'en', players: 5000 };

describe('campaign.service selection-aware econ', () => {
  it('removing a bonus lowers econ.costRatio', () => {
    const full = generateCampaign({ scenario: { id: 'first_launch' }, params: { ...base, bonusTypes: ['welcome', 'reload', 'cashback'] } });
    const less = generateCampaign({ scenario: { id: 'first_launch' }, params: { ...base, bonusTypes: ['welcome'] } });
    expect(less.econ.costRatio).toBeLessThan(full.econ.costRatio);
    expect(less.econ.sP50.cost).toBeLessThan(full.econ.sP50.cost);
  });

  it('econ exposes selectedTypes and breakdown', () => {
    const r = generateCampaign({ scenario: { id: 'second_dep' }, params: { ...base, bonusTypes: ['welcome', 'dep2'] } });
    expect(r.econ.selectedTypes).toEqual(expect.arrayContaining(['welcome', 'dep2']));
    expect(Array.isArray(r.econ.breakdown)).toBe(true);
  });

  it('isChain true only when dep2 and dep3 both selected', () => {
    const chained = generateCampaign({ scenario: { id: 'first_launch' }, params: { ...base, bonusTypes: ['welcome', 'dep2', 'dep3'] } });
    const notChain = generateCampaign({ scenario: { id: 'first_launch' }, params: { ...base, bonusTypes: ['welcome', 'dep2'] } });
    expect(chained.isChain).toBe(true);
    expect(notChain.isChain).toBe(false);
  });
});
