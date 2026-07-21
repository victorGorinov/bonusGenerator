import { z }               from 'zod';
import { tryRepairJSON }   from '../domain/ai/parser.js';
import { AIProviderError } from '../errors/AIProviderError.js';

// Preprocessors — defined first so all schemas can reference them
const anyToString = z.preprocess((val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}, z.string());

const EmailVariant = z.object({ subject: z.string(), body: z.string() });
const PopupVariant = z.object({ headline: z.string(), subtext: z.string(), cta: z.string() });

const TextsResponseSchema = z.object({
  push:     z.array(z.string()).min(1),
  email:    z.array(EmailVariant).min(1),
  sms:      z.array(z.string()).min(1),
  telegram: z.array(z.string()).min(1),
  popup:    z.array(PopupVariant).min(1),
});

const OfferDescriptionResponseSchema = z.object({
  title:               z.string(),
  hook:                z.string(),
  howItWorks:          z.array(z.string()).min(1),
  termsIntro:          z.string(),
  cta:                 z.string(),
  termsAndConditions:  z.array(z.string()).min(1),
});

const AuditCheckSchema = z.object({
  label:  z.string(),
  status: z.enum(['ok', 'warn']),
  note:   anyToString,
  rule:   z.string().optional(),
});

const AuditResponseSchema = z.object({
  checks:          z.array(AuditCheckSchema).min(1),
  recommendations: z.array(z.object({ text: z.string(), impact: z.string() })).min(1),
});

const OptimizeRecommendationSchema = z.object({
  factor:  z.string(),
  param:   z.string(),
  current: anyToString,
  target:  anyToString,
  reason:  anyToString,
  impact:  z.enum(['high', 'med', 'low']),
});

const OptimizeResponseSchema = z.object({
  recommendations: z.array(OptimizeRecommendationSchema).min(1).max(5),
});

const PARAM_ENUM = ['duration','segment','prizePool','poolModel','rake','totalPlayers'] as const;
const paramNormalizer = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const original = val.trim();
  if ((PARAM_ENUM as readonly string[]).includes(original)) return original;
  const normalized = original.toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'prize_pool' || normalized === 'prize pool' || normalized === 'prizepool') return 'prizePool';
  if (normalized === 'pool_model' || normalized === 'poolmodel') return 'poolModel';
  if (normalized === 'total_players' || normalized === 'totalplayers') return 'totalPlayers';
  return original; // pass unknown params through — balance solver ignores unrecognised levers
}, z.string());
const verdictNormalizer = z.preprocess((val) => typeof val === 'string' ? val.trim().toLowerCase() : val, z.enum(['realistic', 'optimistic', 'pessimistic']));
const impactNormalizer = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const normalized = val.trim().toLowerCase();
  if (normalized === 'medium') return 'med';
  return normalized;
}, z.enum(['high', 'med', 'low']));

export type TextsResponse            = z.infer<typeof TextsResponseSchema>;
export type OfferDescriptionResponse = z.infer<typeof OfferDescriptionResponseSchema>;
export type AuditResponse            = z.infer<typeof AuditResponseSchema>;
export type OptimizeResponse         = z.infer<typeof OptimizeResponseSchema>;

function parseRaw(raw: string): unknown {
  const sanitized = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(sanitized);
  } catch {
    const repaired = tryRepairJSON(sanitized);
    if (repaired) return repaired;
    throw new AIProviderError('AI returned malformed JSON');
  }
}

export function parseTextsResponse(raw: string): TextsResponse {
  const parsed = parseRaw(raw);
  const result = TextsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI texts response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseDescriptionResponse(raw: string): OfferDescriptionResponse {
  const parsed = parseRaw(raw);
  const result = OfferDescriptionResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI description response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseAuditResponse(raw: string): AuditResponse {
  const parsed = parseRaw(raw);
  const result = AuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI audit response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseOptimizeResponse(raw: string): OptimizeResponse {
  const parsed = parseRaw(raw);
  const result = OptimizeResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI optimize response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

const TournamentTextsResponseSchema = z.object({
  push:     z.array(z.string()).min(1),
  email:    z.array(z.object({ subject: z.string(), body: z.string() })).min(1),
  sms:      z.array(z.string()).min(1),
  telegram: z.array(z.string()).min(1),
  popup:    z.array(z.object({ headline: z.string(), subtext: z.string(), cta: z.string() })).min(1),
});

const TournamentAuditResponseSchema = z.object({
  checks:          z.array(z.object({ label: z.string(), status: z.enum(['ok', 'warn']), note: anyToString, rule: z.string().optional() })).min(1),
  recommendations: z.array(z.object({ text: anyToString, impact: anyToString })).min(1),
});

export type TournamentTextsResponse = z.infer<typeof TournamentTextsResponseSchema>;
export type TournamentAuditResponse = z.infer<typeof TournamentAuditResponseSchema>;

export function parseTournamentTextsResponse(raw: string): TournamentTextsResponse {
  const parsed = parseRaw(raw);
  const result = TournamentTextsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI tournament texts response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseTournamentAuditResponse(raw: string): TournamentAuditResponse {
  const parsed = parseRaw(raw);
  const result = TournamentAuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI tournament audit response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

const TournamentOptimizeRealismCheckSchema = z.object({
  metric:    anyToString,
  forecast:  anyToString,
  benchmark: anyToString,
  verdict:   verdictNormalizer,
  note:      anyToString,
});

const TournamentOptimizeResponseSchema = z.object({
  realism: z.object({
    verdict: verdictNormalizer,
    summary: anyToString,
    checks:  z.array(TournamentOptimizeRealismCheckSchema).min(3),
  }),
  recommendations: z.array(z.object({
    param:   paramNormalizer,
    current: anyToString,
    target:  anyToString,
    reason:  anyToString,
    impact:  impactNormalizer,
  })).min(1).max(5),
});

export type TournamentOptimizeResponse = z.infer<typeof TournamentOptimizeResponseSchema>;

export function parseTournamentOptimizeResponse(raw: string): TournamentOptimizeResponse {
  const parsed = parseRaw(raw);
  const result = TournamentOptimizeResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI tournament optimize response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

const GamesResponseSchema = z.object({
  rationale: z.string(),
  games:     z.array(z.object({ id: z.string(), why: z.string() })).min(1),
});

export type GamesResponse = z.infer<typeof GamesResponseSchema>;

export function parseGamesResponse(raw: string): GamesResponse {
  const parsed = parseRaw(raw);
  const result = GamesResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI games response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

// ── LOYALTY ───────────────────────────────────────────────────────────────────

const LoyaltyTextsResponseSchema = z.object({
  push:     z.array(z.string()).min(1),
  email:    z.array(z.object({ subject: z.string(), body: z.string() })).min(1),
  sms:      z.array(z.string()).min(1),
  telegram: z.array(z.string()).min(1),
  popup:    z.array(z.object({ headline: z.string(), subtext: z.string(), cta: z.string() })).min(1),
});

const LoyaltyAuditResponseSchema = z.object({
  checks:          z.array(z.object({ label: z.string(), status: z.enum(['ok', 'warn']), note: anyToString, rule: z.string().optional() })).min(1),
  recommendations: z.array(z.object({ text: anyToString, impact: anyToString })).min(1),
});

const LOYALTY_PARAM_ENUM = ['topCashbackRate','earnRateDeposit','earnRateWager','redeemRate','missionCount','numTiers','mode','pointsExpiry'] as const;
const loyaltyParamNormalizer = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const s = val.trim();
  if ((LOYALTY_PARAM_ENUM as readonly string[]).includes(s)) return s;
  const n = s.replace(/[-\s]+(.)/g, (_, c: string) => c.toUpperCase());
  if ((LOYALTY_PARAM_ENUM as readonly string[]).includes(n)) return n;
  return s;
}, z.enum(LOYALTY_PARAM_ENUM));

const LoyaltyOptimizeResponseSchema = z.object({
  recommendations: z.array(z.object({
    param:   loyaltyParamNormalizer,
    current: anyToString,
    target:  anyToString,
    reason:  anyToString,
    impact:  impactNormalizer,
  })).min(1).max(4),
});

export type LoyaltyTextsResponse   = z.infer<typeof LoyaltyTextsResponseSchema>;
export type LoyaltyAuditResponse   = z.infer<typeof LoyaltyAuditResponseSchema>;
export type LoyaltyOptimizeResponse = z.infer<typeof LoyaltyOptimizeResponseSchema>;

export function parseLoyaltyTextsResponse(raw: string): LoyaltyTextsResponse {
  const parsed = parseRaw(raw);
  const result = LoyaltyTextsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI loyalty texts response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseLoyaltyAuditResponse(raw: string): LoyaltyAuditResponse {
  const parsed = parseRaw(raw);
  const result = LoyaltyAuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI loyalty audit response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseLoyaltyOptimizeResponse(raw: string): LoyaltyOptimizeResponse {
  const parsed = parseRaw(raw);
  const result = LoyaltyOptimizeResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI loyalty optimize response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

const LoyaltyMissionsResponseSchema = z.object({
  missions: z.array(z.object({
    id:         z.string(),
    narrative:  anyToString,
    tierEffect: anyToString.optional(),
  })).min(1),
});

export type LoyaltyMissionsResponse = z.infer<typeof LoyaltyMissionsResponseSchema>;

export function parseLoyaltyMissionsResponse(raw: string): LoyaltyMissionsResponse {
  const parsed = parseRaw(raw);
  const result = LoyaltyMissionsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI loyalty missions response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

// ── WHEEL OF FORTUNE ────────────────────────────────────────────────────────

const WheelTextsResponseSchema = z.object({
  push:     z.array(z.string()).min(1),
  email:    z.array(z.object({ subject: z.string(), body: z.string() })).min(1),
  sms:      z.array(z.string()).min(1),
  telegram: z.array(z.string()).min(1),
  popup:    z.array(z.object({ headline: z.string(), subtext: z.string(), cta: z.string() })).min(1),
});

const WheelAuditResponseSchema = z.object({
  checks:          z.array(z.object({ label: z.string(), status: z.enum(['ok', 'warn']), note: anyToString, rule: z.string().optional() })).min(1),
  recommendations: z.array(z.object({ text: anyToString, impact: anyToString })).min(1),
});

const WheelOptimizeResponseSchema = z.object({
  recommendations: z.array(z.object({
    param:   anyToString,
    current: anyToString,
    target:  anyToString,
    reason:  anyToString,
    impact:  impactNormalizer,
  })).min(1).max(4),
});

export type WheelTextsResponse    = z.infer<typeof WheelTextsResponseSchema>;
export type WheelAuditResponse    = z.infer<typeof WheelAuditResponseSchema>;
export type WheelOptimizeResponse = z.infer<typeof WheelOptimizeResponseSchema>;

export function parseWheelTextsResponse(raw: string): WheelTextsResponse {
  const parsed = parseRaw(raw);
  const result = WheelTextsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI wheel texts response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseWheelAuditResponse(raw: string): WheelAuditResponse {
  const parsed = parseRaw(raw);
  const result = WheelAuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI wheel audit response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseWheelOptimizeResponse(raw: string): WheelOptimizeResponse {
  const parsed = parseRaw(raw);
  const result = WheelOptimizeResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI wheel optimize response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

// ── COMPETITOR COMPARISON ─────────────────────────────────────────────────────

const boolNormalizer = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.trim().toLowerCase() === 'true';
  return Boolean(val);
}, z.boolean());

const confidenceNormalizer = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['confirmed', 'unconfirmed']),
);

const nullableUrl = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'н/д') ? null : s;
}, z.string().nullable());

const CompetitorSearchResponseSchema = z.object({
  found:      boolNormalizer,
  confidence: confidenceNormalizer,
  sourceUrl:  nullableUrl,
  // Values coerced to string; keys are the promo-type param keys.
  params:     z.record(z.string(), anyToString).default({}),
  notes:      anyToString.optional(),
});

const CompetitorCompareResponseSchema = z.object({
  verdict:    anyToString,
  strengths:  z.array(anyToString).min(1),
  weaknesses: z.array(anyToString).min(1),
  recommendations: z.array(z.object({
    param:               anyToString,
    current:             anyToString,
    competitorBenchmark: anyToString,
    suggested:           anyToString,
    reason:              anyToString,
    impact:              impactNormalizer,
  })).min(1).max(6),
});

export type CompetitorSearchResponse  = z.infer<typeof CompetitorSearchResponseSchema>;
export type CompetitorCompareResponse = z.infer<typeof CompetitorCompareResponseSchema>;

export function parseCompetitorSearchResponse(raw: string): CompetitorSearchResponse {
  const parsed = parseRaw(raw);
  const result = CompetitorSearchResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI competitor search response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}

export function parseCompetitorCompareResponse(raw: string): CompetitorCompareResponse {
  const parsed = parseRaw(raw);
  const result = CompetitorCompareResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError(`AI competitor compare response failed schema validation: ${JSON.stringify(result.error.flatten())}`);
  return result.data;
}
