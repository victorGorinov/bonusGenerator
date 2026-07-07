import { z } from 'zod';

export const GamesRecommendSchema = z.object({
  // Accepts a 2–3 char country code (de, ru, uk…) OR a region cluster
  // (eu, cis, mn, latam, sweep, crypto — up to 6 chars). The loyalty/CRM
  // Games tab has no country granularity and passes the region directly;
  // recommendGamesForContext resolves it via GEO_CFG[geo]?.region ?? geo.
  geo:       z.string().min(2).max(6),
  segment:   z.enum(['all','new','mid','vip','dormant','depositors']).default('all'),
  providers: z.array(z.string()).optional(),
  plat:      z.enum(['mobile','desk','both']).optional(),
  uiLang:    z.string().optional(),
});

export type GamesRecommendInput = z.infer<typeof GamesRecommendSchema>;
