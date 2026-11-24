import { describe, it, expect } from 'vitest';
import { parseInterpretResponse } from '../../src/ai/parser.js';
import { refineInterpretation, interpretPrompt } from '../../src/use-cases/InterpretPrompt.js';
import { MockAIProvider } from '../../src/ai/providers/mock.js';

// Build a refined result from a raw AI payload the same way interpretPrompt does.
const refineFrom = (obj, uiLang) => refineInterpretation(parseInterpretResponse(JSON.stringify(obj)), uiLang);

describe('refineInterpretation — enum validation', () => {
  it('keeps a valid DE prescriptive request intact', () => {
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'first_dep' }, params: { geo: 'de', segment: 'mid', bonusTypes: ['welcome'], agg: 'mid' } });
    expect(r.params.geo).toBe('de');
    expect(r.params.segment).toBe('mid');
    expect(r.params.bonusTypes).toEqual(['welcome']);
    expect(r.missing).toEqual([]);
  });

  it('drops an unknown geo and flags it missing', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'xx', segment: 'mid' } });
    expect(r.params.geo).toBeUndefined();
    expect(r.missing).toContain('geo');
  });

  it('drops an invalid segment enum value', () => {
    // churn_risk has no scenario-implied segment (unlike first_dep), so a dropped
    // invalid value is observable as undefined rather than refilled by nit-#2.
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'churn_risk' }, params: { geo: 'de', segment: 'whale' } });
    expect(r.params.segment).toBeUndefined();
  });

  it('defaults lic to auto for an off-list value', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', lic: 'bogus' } });
    expect(r.params.lic).toBe('auto');
  });

  it('filters bonusTypes to the known set', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', bonusTypes: ['welcome', 'nonsense', 'reload'] } });
    expect(r.params.bonusTypes).toEqual(['welcome', 'reload']);
  });

  it('clamps players into [100, 200000]', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', players: 9_999_999 } });
    expect(r.params.players).toBe(200000);
  });
});

describe('refineInterpretation — regulatory clamp (BR)', () => {
  it('replaces welcome with reload for BR and notes the prohibition', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'first_dep' }, params: { geo: 'br', segment: 'mid', bonusTypes: ['welcome'], players: 5000 } });
    expect(r.params.bonusTypes).not.toContain('welcome');
    expect(r.params.bonusTypes).toContain('reload');
    expect(r.notes.some((n) => n.includes('14.790'))).toBe(true);
  });

  it('writes the note in Russian when uiLang=ru', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'first_dep' }, params: { geo: 'br', segment: 'mid', bonusTypes: ['welcome'], players: 5000 } }, 'ru');
    expect(r.notes.some((n) => n.includes('запрещены'))).toBe(true);
  });

  it('leaves non-BR welcome untouched', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', bonusTypes: ['welcome'] } });
    expect(r.params.bonusTypes).toEqual(['welcome']);
    expect(r.notes).toEqual([]);
  });
});

describe('refineInterpretation — critical missing recompute', () => {
  it('flags players missing for a goal with no scale', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'churn_risk' }, params: { geo: 'br', segment: 'mid' } });
    expect(r.missing).toContain('players');
  });

  it('does not flag players for a prescriptive request', () => {
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'first_dep' }, params: { geo: 'de', segment: 'mid' } });
    expect(r.missing).not.toContain('players');
  });

  it('flags segment missing when neither segment nor scenario is present', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'de' } });
    expect(r.missing).toContain('segment');
  });

  it('does not flag segment when a valid scenario implies one', () => {
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'vip_retention' }, params: { geo: 'de' } });
    expect(r.missing).not.toContain('segment');
  });

  it('keeps inferred only for keys that are actually set', () => {
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'first_dep' }, params: { geo: 'de', segment: 'mid' }, inferred: ['risk', 'players'] });
    expect(r.inferred).not.toContain('players');
  });
});

describe('refineInterpretation — whole-campaign package fill', () => {
  it('fills the full launch package when no mechanics are named', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'first_launch' }, params: { geo: 'de', segment: 'new', players: 5000 } });
    expect(r.params.bonusTypes).toEqual(['welcome', 'ndb', 'dep2', 'dep3', 'cashback']);
    expect(r.inferred).toContain('bonusTypes');
  });

  it('does not override explicitly named mechanics', () => {
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'first_launch' }, params: { geo: 'de', segment: 'new', bonusTypes: ['welcome'] } });
    expect(r.params.bonusTypes).toEqual(['welcome']);
    expect(r.inferred).not.toContain('bonusTypes');
  });

  it('strips welcome from a BR package but keeps the rest of the campaign', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'first_launch' }, params: { geo: 'br', segment: 'new', players: 5000 } });
    expect(r.params.bonusTypes).not.toContain('welcome');
    expect(r.params.bonusTypes).toEqual(['ndb', 'dep2', 'dep3', 'cashback']);
    expect(r.notes.some((n) => n.includes('14.790'))).toBe(true);
  });

  it('does not fill a package when there is no scenario', () => {
    const r = refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid' } });
    expect(r.params.bonusTypes).toBeUndefined();
  });

  it('uses the reactivation package for churn_risk', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'churn_risk' }, params: { geo: 'de', segment: 'mid', players: 5000 } });
    expect(r.params.bonusTypes).toEqual(['cashback', 'reload']);
  });

  // Regression: the inactive_* reactivation family must fill a package too — these
  // ids exist in SCENARIO_MSG + the frontend BTYPE_PRESETS but were missing from the
  // server map, so a mechanic-less "bring back inactive N days" request produced a
  // single bonus instead of the intended package.
  it('fills the inactive_3 package (reload)', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'inactive_3' }, params: { geo: 'de', segment: 'mid', players: 5000 } });
    expect(r.params.bonusTypes).toEqual(['reload']);
    expect(r.inferred).toContain('bonusTypes');
  });

  it('fills the inactive_7 package (reload + cashback)', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'inactive_7' }, params: { geo: 'de', segment: 'mid', players: 5000 } });
    expect(r.params.bonusTypes).toEqual(['reload', 'cashback']);
  });

  it('fills the inactive_30 package (reload + cashback + dep2)', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'inactive_30' }, params: { geo: 'de', segment: 'mid', players: 5000 } });
    expect(r.params.bonusTypes).toEqual(['reload', 'cashback', 'dep2']);
  });
});

describe('refineInterpretation — scenario-implied segment (nit #2)', () => {
  it('fills vip for vip_retention when segment is not named', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'vip_retention' }, params: { geo: 'de', players: 5000 } });
    expect(r.params.segment).toBe('vip');
    expect(r.inferred).toContain('segment');
    expect(r.missing).not.toContain('segment');
  });

  it('fills new for first_launch when segment is not named', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'first_launch' }, params: { geo: 'de', players: 5000 } });
    expect(r.params.segment).toBe('new');
  });

  it('does not override an explicitly named segment', () => {
    const r = refineFrom({ intent: 'prescriptive', scenario: { id: 'vip_retention' }, params: { geo: 'de', segment: 'new' } });
    expect(r.params.segment).toBe('new');
    expect(r.inferred).not.toContain('segment');
  });

  it('leaves segment unset for a scenario with no implied segment', () => {
    const r = refineFrom({ intent: 'goal', scenario: { id: 'inactive_7' }, params: { geo: 'de', players: 5000 } });
    expect(r.params.segment).toBeUndefined();
    expect(r.missing).not.toContain('segment');
  });
});

describe('refineInterpretation — lang allowlist (nit #3)', () => {
  it('keeps en and ru', () => {
    expect(refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', lang: 'en' } }).params.lang).toBe('en');
    expect(refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', lang: 'RU' } }).params.lang).toBe('ru');
  });

  it('drops any other language code', () => {
    expect(refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', lang: 'de' } }).params.lang).toBeUndefined();
    expect(refineFrom({ intent: 'prescriptive', params: { geo: 'de', segment: 'mid', lang: 'zzzz' } }).params.lang).toBeUndefined();
  });
});

describe('interpretPrompt — through a mock provider', () => {
  it('returns a refined interpretation from the AI payload', async () => {
    const ai = new MockAIProvider([JSON.stringify({
      intent: 'goal', scenario: { id: 'churn_risk', lbl: 'Reactivation' },
      params: { geo: 'br', segment: 'mid', bonusTypes: ['welcome'], players: 5000, agg: 'low' },
      inferred: ['segment'], missing: [], notes: [], confidence: 0.75,
    })]);
    const r = await interpretPrompt({ prompt: 'reactivate dormant in brazil, cheap' }, ai);
    expect(r.intent).toBe('goal');
    expect(r.params.geo).toBe('br');
    expect(r.params.bonusTypes).toContain('reload');
    expect(r.notes.some((n) => n.includes('14.790'))).toBe(true);
  });
});
