import { z } from 'zod';

export const GenerateSchema = z.object({
  region:  z.enum(['cis', 'eu', 'crypto', 'sweep', 'mn', 'latam']),
  players: z.coerce.number().int().min(100).max(200_000),
  sitecur: z.string().min(2).max(10),
  depcur:  z.string().min(2).max(10),
  avgdep:  z.coerce.number().min(1).max(100_000),
  plat:    z.enum(['both', 'mobile', 'desk']),
  lic:     z.enum(['mga', 'ukgc', 'dga', 'bets_br', 'segob', 'coljuegos', 'mincetur', 'curacao', 'anjouan', 'kahnawake', 'gibraltar', 'isle_of_man', 'none']).optional(),
  rtp:     z.coerce.number().min(50).max(99.9),
  riskAdj: z.coerce.number().optional(),
  segment: z.enum(['new', 'mid', 'vip']).optional(),
}).passthrough();

export type GenerateInput = z.infer<typeof GenerateSchema>;
