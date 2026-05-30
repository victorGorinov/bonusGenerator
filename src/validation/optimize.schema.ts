import { z } from 'zod';

const LiftSchema = z.object({
  wagFactor:  z.number(),
  wagerX:     z.number(),
  beW:        z.number(),
  genFactor:  z.number(),
  matchPct:   z.number(),
  mechFactor: z.number(),
  hasNDB:     z.boolean(),
  hasReload:  z.boolean(),
  hasDep2:    z.boolean(),
  hasFS:      z.boolean(),
  hasCB:      z.boolean(),
  rtpFactor:  z.number(),
  rtp:        z.number(),
  platFactor: z.number(),
  plat:       z.string(),
  base:       z.number(),
  lift:       z.number(),
});

const EconomicsSchema = z.object({
  net:       z.number(),
  campCost3: z.number(),
  incrRev:   z.number(),
  incrPl:    z.number(),
  pl:        z.number(),
});

export const OptimizeSchema = z.object({
  geo:        z.string(),
  segment:    z.enum(['new', 'mid', 'vip']),
  lift:       LiftSchema,
  economics:  EconomicsSchema,
  uiLang:     z.string().optional(),
});

export type OptimizeInput = z.infer<typeof OptimizeSchema>;
