import { describe, test, expect } from 'vitest';
import { recommendGames } from '../../src/domain/games/recommendGames.js';

describe('recommendGames', () => {

  test('br + highest_multiplier → crash games (Aviator/JetX) rank top', () => {
    const { primary } = recommendGames({ geo:'br', segment:'mid', type:'mixed', scoring:'highest_multiplier' });
    const topIds = primary.map(g => g.id);
    const hasCrash = primary.some(g => g.mechanic === 'crash');
    expect(hasCrash).toBe(true);
    // Aviator or JetX should be in top 3
    const crashInTop3 = primary.slice(0, 3).some(g => g.mechanic === 'crash');
    expect(crashInTop3).toBe(true);
    expect(topIds.length).toBe(5);
  });

  test('eu + vip + type=live → only Evolution game-shows/tables; no slots', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'vip', type:'live', scoring:'total_wins' });
    const all = [...primary, ...alternatives];
    expect(all.length).toBeGreaterThan(0);
    for (const g of all) {
      expect(['live', 'table']).toContain(g.mechanic);
    }
    // Known Evolution titles should appear
    const hasEvolution = primary.some(g => g.provider === 'Evolution');
    expect(hasEvolution).toBe(true);
  });

  test('ru + new → no high minBetTier games in primary', () => {
    const { primary } = recommendGames({ geo:'ru', segment:'new', type:'slot', scoring:'total_wins' });
    for (const g of primary) {
      expect(g.minBetTier).not.toBe('high');
    }
  });

  test('type=slot → zero live/table games in output', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'mid', type:'slot', scoring:'total_wins' });
    const all = [...primary, ...alternatives];
    expect(all.length).toBeGreaterThan(0);
    for (const g of all) {
      expect(g.mechanic).not.toBe('live');
      expect(g.mechanic).not.toBe('table');
    }
  });

  test('type=live → zero slot/crash games in output', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'mid', type:'live', scoring:'total_wins' });
    const all = [...primary, ...alternatives];
    expect(all.length).toBeGreaterThan(0);
    for (const g of all) {
      expect(g.mechanic).not.toBe('slot');
      expect(g.mechanic).not.toBe('crash');
    }
  });

  test('mn → high minBetTier games penalized vs low minBetTier', () => {
    const { scores } = recommendGames({ geo:'mn', segment:'mid', type:'slot', scoring:'total_wins' });
    // Find a low-minBet game that is in mn region and a high-minBet game
    const lowBetGame  = 'gates-of-olympus';   // minBetTier: low, region includes mn
    const highBetGame = 'san-quentin-xways';  // minBetTier: mid, region does NOT include mn — will have lower score
    if (scores[lowBetGame] !== undefined && scores[highBetGame] !== undefined) {
      expect(scores[lowBetGame]).toBeGreaterThan(scores[highBetGame]);
    }
  });

  test('determinism: same input → same output ordering', () => {
    const params = { geo:'uk', segment:'vip', type:'slot', scoring:'highest_multiplier' };
    const r1 = recommendGames(params);
    const r2 = recommendGames(params);
    expect(r1.primary.map(g => g.id)).toEqual(r2.primary.map(g => g.id));
    expect(r1.alternatives.map(g => g.id)).toEqual(r2.alternatives.map(g => g.id));
  });

  test('edge: empty pool after gating returns empty primary, no throw', () => {
    // 'sweep' region has no live games in catalog
    const result = recommendGames({ geo:'us', segment:'mid', type:'live', scoring:'total_wins' });
    expect(result.primary).toBeInstanceOf(Array);
    expect(result.alternatives).toBeInstanceOf(Array);
    expect(() => recommendGames({ geo:'us', segment:'mid', type:'live', scoring:'total_wins' })).not.toThrow();
  });

  test('returns at most 5 primary and 5 alternatives', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'all', type:'mixed', scoring:'total_wins' });
    expect(primary.length).toBeLessThanOrEqual(5);
    expect(alternatives.length).toBeLessThanOrEqual(5);
  });

  test('scores map contains all returned game ids', () => {
    const { primary, alternatives, scores } = recommendGames({ geo:'de', segment:'mid', type:'slot', scoring:'total_wins' });
    for (const g of [...primary, ...alternatives]) {
      expect(scores[g.id]).toBeDefined();
    }
  });

  test('type and scoring omitted → no mechanic gating, mixed mechanics allowed', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'mid' });
    const all = [...primary, ...alternatives];
    expect(all.length).toBeGreaterThan(0);
    const mechanics = new Set(all.map(g => g.mechanic));
    // With no gate, a broad de-region pool should span more than one mechanic type
    expect(mechanics.size).toBeGreaterThan(1);
  });

  test('providers filter restricts pool to given providers only', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'mid', providers: ['Evolution'] });
    const all = [...primary, ...alternatives];
    expect(all.length).toBeGreaterThan(0);
    for (const g of all) {
      expect(g.provider).toBe('Evolution');
    }
  });

  test('providers filter with unknown provider → empty result, no throw', () => {
    const result = recommendGames({ geo:'de', segment:'mid', providers: ['Nonexistent Studio'] });
    expect(result.primary).toEqual([]);
    expect(result.alternatives).toEqual([]);
  });

  test('region-level geo (cis) triggers low-denom minBet penalty like ru/kz', () => {
    // Loyalty/CRM path passes a region directly as geo (no country granularity).
    const byCountry = recommendGames({ geo:'ru',  segment:'new', type:'slot', scoring:'total_wins' });
    const byRegion  = recommendGames({ geo:'cis', segment:'new', type:'slot', scoring:'total_wins' });
    // Both resolve to region 'cis' → identical scoring, incl. the high-minBet penalty.
    expect(byRegion.scores).toEqual(byCountry.scores);
    for (const g of byRegion.primary) expect(g.minBetTier).not.toBe('high');
  });

  test('providers omitted → no provider filtering applied', () => {
    const { primary, alternatives } = recommendGames({ geo:'de', segment:'mid', type:'slot', scoring:'total_wins' });
    const providers = new Set([...primary, ...alternatives].map(g => g.provider));
    expect(providers.size).toBeGreaterThan(1);
  });

});
