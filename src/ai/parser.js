import { z }              from 'zod';
import { tryRepairJSON } from '../domain/ai/parser.js';
import { AIProviderError } from '../errors/AIProviderError.js';

// ── Schemas ───────────────────────────────────────────────────────────────────

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
  recommendations: z.array(
    z.object({ text: z.string(), impact: z.string() })
  ).min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRaw(raw) {
  const sanitized = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(sanitized);
  } catch (_) {
    const repaired = tryRepairJSON(sanitized);
    if (repaired) return repaired;
    throw new AIProviderError('AI returned malformed JSON');
  }
}

// ── Public parsers ────────────────────────────────────────────────────────────

export function parseTextsResponse(raw) {
  const parsed = parseRaw(raw);
  const result = TextsResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI texts response failed schema validation');
  return result.data;
}

export function parseAuditResponse(raw) {
  const parsed = parseRaw(raw);
  const result = AuditResponseSchema.safeParse(parsed);
  if (!result.success) throw new AIProviderError('AI audit response failed schema validation');
  return result.data;
}
