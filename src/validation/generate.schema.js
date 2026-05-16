import { z } from 'zod';

export const GenerateSchema = z.object({
  region:  z.enum(['cis', 'eu', 'crypto', 'sweep', 'mn', 'latam']),
  players: z.coerce.number().int().min(100).max(200_000),
  sitecur: z.string().min(2).max(10),
  depcur:  z.string().min(2).max(10),
  avgdep:  z.coerce.number().min(1).max(100_000),
  plat:    z.enum(['both', 'mobile', 'desk']),
  lic:     z.enum(['mga', 'ukgc', 'none']).optional(),
  rtp:     z.coerce.number().min(50).max(99.9),
  riskAdj: z.coerce.number().optional(),
}).passthrough();
