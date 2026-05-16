import { z } from 'zod';

export const SignupSchema = z.object({
  name:  z.string().max(200).optional(),
  email: z.string().email(),
  role:  z.string().max(100).optional(),
});
