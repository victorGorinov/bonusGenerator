import { z } from 'zod';

export const DescriptionSchema = z.object({
  scenario:     z.object({ lbl: z.string().max(200).optional() }).optional(),
  mechanic:     z.record(z.string(), z.unknown()).nullable().optional(),
  mechanicType: z.string().max(20).optional(),
  uiLang:       z.string().min(2).max(5).optional(),
  params: z.object({
    geo:     z.string().length(2),
    lang:    z.string().min(2).max(5).optional(),
    tone:    z.string().max(20).optional(),
    segment: z.string().max(10).optional(),
    lic:     z.string().max(20).optional(),
  }),
});

export type DescriptionInput = z.infer<typeof DescriptionSchema>;
