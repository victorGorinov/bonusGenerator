import { z } from 'zod';

export const AssistantInterpretSchema = z.object({
  prompt:  z.string().min(1).max(2000),
  uiLang:  z.string().min(2).max(5).optional(),
  // Reserved for Phase 2 multi-turn draft accumulation; accepted but unused in Phase 1.
  context: z.record(z.string(), z.unknown()).optional(),
});

export type AssistantInterpretInput = z.infer<typeof AssistantInterpretSchema>;
