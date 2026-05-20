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

export type TextsResponse    = z.infer<typeof TextsResponseSchema>;
export type AuditResponse    = z.infer<typeof AuditResponseSchema>;
export type OptimizeResponse = z.infer<typeof OptimizeResponseSchema>;

function parseRaw(raw: string): unknown {
  const sanitized = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(sanitized);
  } catch (_) {
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
