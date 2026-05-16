import { z } from 'zod';

export const AuditSchema = z.object({
  scenario:     z.object({ lbl: z.string().max(200).optional() }).optional(),
  mechanic:     z.record(z.unknown()).optional(),
  mechanicType: z.string().max(20).optional(),
  uiLang:       z.string().min(2).max(5).optional(),
  params: z.object({
    geo:     z.string().length(2),
    lang:    z.string().min(2).max(5).optional(),
    segment: z.string().max(10).optional(),
    risk:    z.enum(['low', 'mid', 'high']).optional(),
  }),
});
