import { z } from 'zod';

// Shared shapes ──────────────────────────────────────────────────────────────
export const PromoTypeEnum = z.enum(['bonus', 'tournament', 'loyalty', 'wheel']);

// Normalised competitor/own parameters keyed by a stable param key (set depends
// on promoType — see competitor-compare.prompt.ts). Values are strings or
// numbers as they come from buildConfig / manual entry / AI search.
const ParamMap = z.record(z.string().max(40), z.union([z.string().max(200), z.number()]));

// POST /api/competitor/search — live AI web-search for one competitor's public
// offer. One casino per call (the frontend fans out for multiple competitors).
export const CompetitorSearchSchema = z.object({
  casinoName: z.string().min(1).max(120),
  region:     z.string().min(2).max(10),
  promoType:  PromoTypeEnum,
  uiLang:     z.string().min(2).max(5).optional(),
});

// POST /api/competitor/compare — deterministic-normalised own offer + up to 3
// competitors → AI verdict + recommendations. No web search here.
export const CompetitorCompareSchema = z.object({
  region:    z.string().min(2).max(10),
  promoType: PromoTypeEnum,
  ownOffer:  z.object({
    label:  z.string().max(200).optional(),
    params: ParamMap,
  }),
  competitors: z.array(z.object({
    name:       z.string().min(1).max(120),
    source:     z.enum(['ai_search', 'manual']),
    confidence: z.enum(['confirmed', 'unconfirmed']).optional(),
    sourceUrl:  z.string().max(500).nullable().optional(),
    params:     ParamMap,
  })).min(1).max(3),
  uiLang: z.string().min(2).max(5).optional(),
});

export type PromoType              = z.infer<typeof PromoTypeEnum>;
export type CompetitorSearchInput  = z.infer<typeof CompetitorSearchSchema>;
export type CompetitorCompareInput = z.infer<typeof CompetitorCompareSchema>;
