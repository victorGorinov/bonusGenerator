import { z } from 'zod';

export const RecalcSchema = z.object({
  cfg:       z.record(z.unknown()),
  overrides: z.record(z.coerce.number()).optional(),
});
