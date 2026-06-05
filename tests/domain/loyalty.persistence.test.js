import { describe, it, expect } from 'vitest';
import { buildLoyaltyConfig } from '../../src/domain/loyalty/buildConfig.js';

const BASE = {
  mode: 'hybrid',
  numTiers: 5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager: 1,
  redeemRate: 100,
  redeemMinPoints: 1000,
  pointsExpiry: 0,
  missionCount: 4,
  region: 'eu',
  segment: 'mid',
  players: 1000,
  avgdep: 100,
  arpu: 50,
};

// Mirrors updateProgramMissions from loyalty-generator.js — pure logic, no localStorage
function mergeMissions(missions, narrativeById) {
  return missions.map(m => {
    const n = narrativeById[m.id];
    if (!n) return m;
    return { ...m, narrative: n.narrative, tierEffect: n.tierEffect };
  });
}

// Mirrors updateProgramMissions operating on a program list
function updateProgramMissions(list, id, narrativeById) {
  return list.map(p => {
    if (p.id !== id) return p;
    const missions = mergeMissions(p.result.config.missions || [], narrativeById);
    return { ...p, result: { ...p.result, config: { ...p.result.config, missions } } };
  });
}

describe('loyalty persistence — link survives JSON round-trip', () => {
  it('hybrid: link fields preserved after JSON.stringify / JSON.parse', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const linkedMission = cfg.missions.find(m => m.link);
    expect(linkedMission).toBeDefined();

    const snapshot = JSON.parse(JSON.stringify(cfg));
    const restored = snapshot.missions.find(m => m.id === linkedMission.id);

    expect(restored.link).toBeDefined();
    expect(restored.link.tierPointsContribution).toBe(linkedMission.link.tierPointsContribution);
    expect(restored.link.monthlyTierPoints).toBe(linkedMission.link.monthlyTierPoints);
    expect(restored.link.multiplierBoost).toBe(linkedMission.link.multiplierBoost);
    expect(restored.link.boostDurationDays).toBe(linkedMission.link.boostDurationDays);
    expect(restored.link.eligibleTiers).toEqual(linkedMission.link.eligibleTiers);
    expect(restored.link.acceleratesUpgrade).toBe(linkedMission.link.acceleratesUpgrade);
  });

  it('missions mode: no link field present after round-trip', () => {
    const cfg = buildLoyaltyConfig({ ...BASE, mode: 'missions' });
    const snapshot = JSON.parse(JSON.stringify(cfg));
    snapshot.missions.forEach(m => expect(m.link).toBeUndefined());
  });
});

describe('loyalty persistence — narrative merge by id', () => {
  it('merges narrative by id, not index', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const [m0, m1, m2] = cfg.missions;

    // Provide narratives in reversed order (permutation)
    const narrativeById = {
      [m2.id]: { narrative: 'Narrative C', tierEffect: 'Effect C' },
      [m0.id]: { narrative: 'Narrative A', tierEffect: 'Effect A' },
    };

    const merged = mergeMissions(cfg.missions, narrativeById);

    expect(merged.find(m => m.id === m0.id).narrative).toBe('Narrative A');
    expect(merged.find(m => m.id === m0.id).tierEffect).toBe('Effect A');
    expect(merged.find(m => m.id === m2.id).narrative).toBe('Narrative C');
    expect(merged.find(m => m.id === m2.id).tierEffect).toBe('Effect C');
    // m1 had no narrative provided — original mission unchanged
    expect(merged.find(m => m.id === m1.id).narrative).toBeUndefined();
  });

  it('missing ids in narrativeById are silently skipped', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const original = cfg.missions.map(m => ({ ...m }));

    const merged = mergeMissions(cfg.missions, { 'non-existent-id': { narrative: 'X' } });

    merged.forEach((m, i) => {
      expect(m.id).toBe(original[i].id);
      expect(m.narrative).toBeUndefined();
    });
  });

  it('empty narrativeById leaves all missions unchanged', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const merged = mergeMissions(cfg.missions, {});
    merged.forEach(m => expect(m.narrative).toBeUndefined());
  });
});

describe('loyalty persistence — updateProgramMissions', () => {
  function makeProgram(id, missions) {
    return { id, result: { config: { missions } }, updatedAt: '2026-01-01T00:00:00.000Z' };
  }

  it('updates the target program and does not touch others', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const [m0, m1] = cfg.missions;

    const list = [
      makeProgram('prog-A', cfg.missions),
      makeProgram('prog-B', [{ ...m0 }, { ...m1 }]),
    ];

    const narrativeById = { [m0.id]: { narrative: 'Hello', tierEffect: 'Boost' } };
    const updated = updateProgramMissions(list, 'prog-A', narrativeById);

    // prog-A got the narrative
    const pA = updated.find(p => p.id === 'prog-A');
    expect(pA.result.config.missions.find(m => m.id === m0.id).narrative).toBe('Hello');

    // prog-B is untouched
    const pB = updated.find(p => p.id === 'prog-B');
    expect(pB.result.config.missions.find(m => m.id === m0.id).narrative).toBeUndefined();
  });

  it('unknown id — list returned unchanged', () => {
    const cfg = buildLoyaltyConfig(BASE);
    const list = [makeProgram('prog-A', cfg.missions)];
    const before = JSON.stringify(list);
    const updated = updateProgramMissions(list, 'no-such-id', { [cfg.missions[0].id]: { narrative: 'X' } });
    expect(JSON.stringify(updated)).toBe(before);
  });
});

describe('loyalty persistence — old snapshots without link/narrative', () => {
  it('missions without link field are iterable without errors', () => {
    const legacyMissions = [
      { id: 'miss-1', name: 'Legacy Mission', objective: 'deposit', targetBase: 1, frequency: 'weekly', rewardType: 'cash_bonus', rewardValue: 10 },
      { id: 'miss-2', name: 'Old Mission',    objective: 'wager',   targetBase: 5, frequency: 'monthly', rewardType: 'points', rewardValue: 500 },
    ];

    // Simulates missionListHTML guard: render only if m.link is truthy
    const rendered = legacyMissions.map(m => ({
      id: m.id,
      hasLinkBlock: !!m.link,
      hasNarrative: !!m.narrative,
    }));

    rendered.forEach(r => {
      expect(r.hasLinkBlock).toBe(false);
      expect(r.hasNarrative).toBe(false);
    });
  });

  it('mergeMissions on legacy missions (no link) does not throw', () => {
    const legacyMissions = [
      { id: 'miss-1', name: 'Legacy', objective: 'deposit', targetBase: 1, frequency: 'weekly', rewardType: 'points', rewardValue: 100 },
    ];
    expect(() => mergeMissions(legacyMissions, { 'miss-1': { narrative: 'Desc', tierEffect: 'Boost' } })).not.toThrow();
    const merged = mergeMissions(legacyMissions, { 'miss-1': { narrative: 'Desc', tierEffect: 'Boost' } });
    expect(merged[0].narrative).toBe('Desc');
    expect(merged[0].link).toBeUndefined();
  });
});
