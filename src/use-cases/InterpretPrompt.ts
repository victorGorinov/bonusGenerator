import { GEO_CFG, SCENARIO_MSG }       from '../domain/campaign/scenarios.js';
import { buildInterpretPrompt }         from '../ai/prompts/assistant-interpret.prompt.js';
import { parseInterpretResponse }       from '../ai/parser.js';
import type { InterpretResponse }       from '../ai/parser.js';
import type { AssistantInterpretInput } from '../validation/assistant.schema.js';
import type { AIProvider }              from '../ai/interface.js';

// Authoritative enum allowlists — mirror src/validation/campaign.schema.ts
// ParamsShape. The AI's output is NEVER trusted for these; anything off-list is
// dropped (and, when critical, surfaced in `missing`). geo/scenario come from the
// live configs so they can't drift.
const SEGMENTS  = ['new', 'mid', 'vip'] as const;
const VERTICALS = ['casino', 'sports', 'both'] as const;
const GAMES     = ['slots', 'table', 'live'] as const;
const LEVELS    = ['low', 'mid', 'high'] as const;
const TONES     = ['friendly', 'pro', 'aggressive'] as const;
const LICS      = ['auto', 'mga', 'ukgc', 'dga', 'bets_br', 'segob', 'coljuegos', 'mincetur', 'curacao', 'anjouan', 'kahnawake', 'gibraltar', 'isle_of_man', 'none'] as const;
const BONUS     = ['welcome', 'ndb', 'reload', 'cashback', 'dep2', 'dep3', 'fs'] as const;
// The app's i18n (bonusLang) only knows en/ru; downstream `uiLang` collapses anything
// not 'ru' to 'en', so any other value is dead data — allowlist it to the two real ones.
const LANGS     = ['en', 'ru'] as const;

// Default mechanic PACKAGE per scenario — the server mirror of BTYPE_PRESETS in
// public/campaign-generator.js (the dashboard quick-start packages). Used when the
// operator describes a scenario WITHOUT naming specific mechanics: the assistant
// then builds the WHOLE campaign (e.g. first_launch → welcome + ndb + dep2 + dep3 +
// cashback), exactly like the start-page quick-start button, instead of one bonus.
// Keys are SCENARIO_MSG ids — keep in step with the frontend preset.
const SCENARIO_DEFAULT_MECHANICS: Record<string, string[]> = {
  first_launch:     ['welcome', 'ndb', 'dep2', 'dep3', 'cashback'],
  inactive_3:       ['reload'],
  inactive_7:       ['reload', 'cashback'],
  inactive_30:      ['reload', 'cashback', 'dep2'],
  churn_risk:       ['cashback', 'reload'],
  return_win:       ['reload'],
  return_loss:      ['cashback'],
  first_dep:        ['welcome', 'ndb'],
  second_dep:       ['dep2', 'reload'],
  big_dep:          ['welcome', 'cashback'],
  vip_retention:    ['cashback'],
  vip_reactivation: ['cashback', 'reload'],
  sport_event:      ['reload'],
  tournament:       ['reload', 'cashback'],
  cashback:         ['cashback'],
  custom:           ['welcome', 'reload'],
};

// Default SEGMENT per scenario — the server mirror of SEGMENT_PRESETS in
// public/campaign-generator.js. Used when the operator names a scenario but no
// segment: without this the campaign service defaults every scenario to 'mid', so
// "VIP retention in DE" would generate at 'mid' instead of 'vip'. Scenarios not
// listed here have no inherent segment → they stay 'mid' (the service default).
const SCENARIO_DEFAULT_SEGMENT: Record<string, string> = {
  first_launch:     'new',
  first_dep:        'new',
  vip_retention:    'vip',
  vip_reactivation: 'vip',
};

export interface InterpretedParams {
  geo?:        string;
  segment?:    string;
  vertical?:   string;
  games?:      string;
  bonusTypes?: string[];
  lic?:        string;
  agg?:        string;
  risk?:       string;
  players?:    number;
  budget?:     string;
  lang?:       string;
  tone?:       string;
}

export interface InterpretedCampaign {
  intent:     'prescriptive' | 'goal' | 'problem';
  scenario:   { id: string; lbl?: string; cat?: string } | null;
  params:     InterpretedParams;
  inferred:   string[];
  missing:    string[];
  notes:      string[];
  confidence: number;
}

const lc = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : undefined;

const inList = (v: string | undefined, list: readonly string[]): string | undefined =>
  v !== undefined && list.includes(v) ? v : undefined;

function toInt(v: number | string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^\d.-]/g, ''), 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(200_000, Math.max(100, Math.round(n)));
}

// Pure refinement: validate every enum against the authoritative lists, apply the
// BR welcome-prohibition clamp, and recompute the critical `missing` set rather than
// trusting the model. Exported so tests can exercise it without an AI call.
export function refineInterpretation(raw: InterpretResponse, uiLang?: string): InterpretedCampaign {
  const geoKeys      = new Set(Object.keys(GEO_CFG));
  const scenarioIds  = new Set(Object.keys(SCENARIO_MSG));
  const isRu         = (uiLang ?? 'en') === 'ru';

  const p = raw.params ?? {};
  const params: InterpretedParams = {};

  const geo = lc(p.geo);
  if (geo && geoKeys.has(geo)) params.geo = geo;

  params.segment  = inList(lc(p.segment),  SEGMENTS);
  params.vertical = inList(lc(p.vertical), VERTICALS);
  params.games    = inList(lc(p.games),    GAMES);
  params.agg      = inList(lc(p.agg),      LEVELS);
  params.risk     = inList(lc(p.risk),     LEVELS);
  params.tone     = inList(lc(p.tone),     TONES);
  params.lic      = inList(lc(p.lic),      LICS) ?? 'auto';

  const players = toInt(p.players);
  if (players !== undefined) params.players = players;

  if (p.budget !== undefined && String(p.budget).trim()) params.budget = String(p.budget).trim();
  params.lang = inList(lc(p.lang), LANGS);

  if (Array.isArray(p.bonusTypes)) {
    const bt = p.bonusTypes.map(lc).filter((b): b is string => inList(b, BONUS) !== undefined);
    if (bt.length) params.bonusTypes = Array.from(new Set(bt));
  }

  // Scenario — only keep a valid id.
  let scenario: InterpretedCampaign['scenario'] = null;
  if (raw.scenario && scenarioIds.has(raw.scenario.id)) {
    scenario = { id: raw.scenario.id, lbl: raw.scenario.lbl, cat: raw.scenario.cat };
  }

  // Whole-campaign default: when the operator named NO specific mechanics, fill the
  // scenario's full package (same as the dashboard quick-start) so e.g. "first
  // launch" builds the whole campaign, not a single bonus. Runs BEFORE the BR clamp
  // below, so a prohibited welcome in the package is still stripped for Brazil.
  let packageFilled = false;
  if (!params.bonusTypes && scenario && SCENARIO_DEFAULT_MECHANICS[scenario.id]) {
    params.bonusTypes = [...SCENARIO_DEFAULT_MECHANICS[scenario.id]];
    packageFilled = true;
  }

  // Scenario-implied segment: when the operator named a scenario but no segment,
  // fill the segment the scenario implies (mirror of the frontend SEGMENT_PRESETS)
  // instead of letting the campaign service silently default it to 'mid'.
  let segmentFilled = false;
  if (!params.segment && scenario && SCENARIO_DEFAULT_SEGMENT[scenario.id]) {
    params.segment = SCENARIO_DEFAULT_SEGMENT[scenario.id];
    segmentFilled = true;
  }

  const notes: string[] = Array.isArray(raw.notes) ? raw.notes.filter((n) => typeof n === 'string' && n.trim()) : [];

  // ── Regulatory clamp: BR prohibits welcome bonuses (Law 14.790/2023). ──
  if (params.geo === 'br' && params.bonusTypes?.includes('welcome')) {
    params.bonusTypes = params.bonusTypes.filter((b) => b !== 'welcome');
    if (params.bonusTypes.length === 0) params.bonusTypes = ['reload'];
    if (!notes.some((n) => n.includes('14.790'))) {
      notes.push(isRu
        ? 'BR: welcome-бонусы запрещены (Law 14.790) — предложен reload вместо велкома'
        : 'BR: welcome bonuses are prohibited (Law 14.790) — proposed reload instead');
    }
  }

  // Strip undefined params.
  (Object.keys(params) as (keyof InterpretedParams)[]).forEach((k) => {
    if (params[k] === undefined) delete params[k];
  });

  // ── Recompute the critical `missing` set (don't trust the model). ──
  const missing = new Set<string>();
  if (!params.geo) missing.add('geo');
  if (!params.segment && !scenario) missing.add('segment');
  if (raw.intent === 'goal' && params.players === undefined) missing.add('players');

  // inferred: keep only keys the model claims as default AND that are actually set
  // and not themselves missing.
  const setKeys = new Set(Object.keys(params));
  const inferredSet = new Set(
    (Array.isArray(raw.inferred) ? raw.inferred : [])
      .filter((k) => typeof k === 'string' && setKeys.has(k) && !missing.has(k)),
  );
  // The auto-filled package / scenario segment are defaults, not operator-stated.
  if (packageFilled && setKeys.has('bonusTypes')) inferredSet.add('bonusTypes');
  if (segmentFilled && setKeys.has('segment')) inferredSet.add('segment');

  return {
    intent:     raw.intent,
    scenario,
    params,
    inferred:   Array.from(inferredSet),
    missing:    Array.from(missing),
    notes,
    confidence: raw.confidence,
  };
}

export async function interpretPrompt(input: AssistantInterpretInput, ai: AIProvider): Promise<InterpretedCampaign> {
  const prompt = buildInterpretPrompt({
    prompt:      input.prompt,
    uiLang:      input.uiLang,
    geoKeys:     Object.keys(GEO_CFG),
    scenarioIds: Object.keys(SCENARIO_MSG),
  });
  const raw = await ai.generate(prompt, { maxTokens: 700 });
  return refineInterpretation(parseInterpretResponse(raw), input.uiLang);
}
