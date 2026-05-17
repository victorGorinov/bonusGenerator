import { z } from 'zod';

export const RecalcSchema = z.object({
  cfg:       z.record(z.string(), z.unknown()),
  overrides: z.record(z.string(), z.coerce.number()).optional(),
});

export type RecalcInput = z.infer<typeof RecalcSchema>;
