import { z }               from 'zod';
import { tryRepairJSON }   from '../domain/ai/parser.js';
import { AIProviderError } from '../errors/AIProviderError.js';

const EmailVariant = z.object({ subject: z.string(), body: z.string() });
const PopupVariant = z.object({ headline: z.string(), subtext: z.string(), cta: z.string() });

const TextsResponseSchema = z.object({
  push:     z.array(z.string()).min(1),
  email:    z.array(EmailVariant).min(1),
  sms:      z.array(z.string()).min(1),
  telegram: z.array(z.string()).min(1),
  popup:    z.array(PopupVariant).min(1),
});

const AuditCheckSchema = z.object({
  label:  z.string(),
  status: z.enum(['ok', 'warn']),
  note:   z.string(),
  rule:   z.string().optional(),
});

const AuditResponseSchema = z.object({
  checks:          z.array(AuditCheckSchema).min(1),
  recommendations: z.array(z.object({ text: z.string(), impact: z.string() })).min(1),
});

const OptimizeRecommendationSchema = z.object({
  factor:  z.string(),
  param:   z.string(),
  current: z.string(),
  target:  z.string(),
  reason:  z.string(),
  impact:  z.enum(['high', 'med', 'low']),
});

const OptimizeResponseSchema = z.object({
  recommendations: z.array(OptimizeRecommendationSchema).min(1).max(5),
});

const numberToString = z.preprocess((val) => typeof val === 'number' ? String(val) : val, z.string());
const PARAM_ENUM = ['duration','segment','prizePool','poolModel','rake','totalPlayers'] as const;
const paramNormalizer = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const original = val.trim();
  if ((PARAM_ENUM as readonly string[]).includes(original)) return original;
  const normalized = original.toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'prize_pool' || normalized === 'prizepool') return 'prizePool';
  if (normalized === 'pool_model' || normalized === 'poolmodel') return 'poolModel';
  if (normalized === 'total_players' || normalized === 'totalplayers') return 'totalPlayers';
  return normalized;
}, z.enum(PARAM_ENUM));
const verdictNormalizer = z.preprocess((val) => typeof val === 'string' ? val.trim().toLowerCase() : val, z.enum(['realistic', 'optimistic', 'pessimistic']));
const impactNormalizer = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const normalized = val.trim().toLowerCase();
  if (normalized === 'medium') return 'med';
  return normalized;
}, z.enum(['high', 'med', 'low']));

export type TextsResponse    = z.infer<typeof TextsResponseSchema>;
export type AuditResponse    = z.infer<typeof AuditResponseSchema>;
export type OptimizeResponse = z.infer<typeof OptimizeResponseSchema>;

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
  if (!result.success) throw new AIProviderError('AI texts response failed schema validation');
  return result.data;
}

export function parseAuditResponse(raw: string): AuditResponse {
  const parsed = parseRaw(raw);
  const result = AuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI audit response failed schema validation');
  return result.data;
}

export function parseOptimizeResponse(raw: string): OptimizeResponse {
  const parsed = parseRaw(raw);
  const result = OptimizeResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI optimize response failed schema validation');
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
  checks:          z.array(z.object({ label: z.string(), status: z.enum(['ok', 'warn']), note: z.string(), rule: z.string().optional() })).min(1),
  recommendations: z.array(z.object({ text: z.string(), impact: z.string() })).min(1),
});

export type TournamentTextsResponse = z.infer<typeof TournamentTextsResponseSchema>;
export type TournamentAuditResponse = z.infer<typeof TournamentAuditResponseSchema>;

export function parseTournamentTextsResponse(raw: string): TournamentTextsResponse {
  const parsed = parseRaw(raw);
  const result = TournamentTextsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI tournament texts response failed schema validation');
  return result.data;
}

export function parseTournamentAuditResponse(raw: string): TournamentAuditResponse {
  const parsed = parseRaw(raw);
  const result = TournamentAuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI tournament audit response failed schema validation');
  return result.data;
}

const TournamentOptimizeRealismCheckSchema = z.object({
  metric:    z.preprocess((val) => typeof val === 'string' ? val.trim().toLowerCase().replace(/\s+/g, '_') : val, z.enum(['participation', 'engagement', 'roi', 'cost_per_active', 'retention', 'arpu'])),
  forecast:  numberToString,
  benchmark: numberToString,
  verdict:   verdictNormalizer,
  note:      numberToString,
});

const TournamentOptimizeResponseSchema = z.object({
  realism: z.object({
    verdict: verdictNormalizer,
    summary: numberToString,
    checks:  z.array(TournamentOptimizeRealismCheckSchema).min(3).max(6),
  }),
  recommendations: z.array(z.object({
    param:   paramNormalizer,
    current: numberToString,
    target:  numberToString,
    reason:  numberToString,
    impact:  impactNormalizer,
  })).min(1).max(3),
});

export type TournamentOptimizeResponse = z.infer<typeof TournamentOptimizeResponseSchema>;

export function parseTournamentOptimizeResponse(raw: string): TournamentOptimizeResponse {
  const parsed = parseRaw(raw);
  const result = TournamentOptimizeResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI tournament optimize response failed schema validation');
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
  if (!result.success) throw new AIProviderError('AI games response failed schema validation');
  return result.data;
}
