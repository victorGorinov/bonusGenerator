import { z } from 'zod';

export const TournamentGenerateSchema = z.object({
  type:   z.enum(['slot', 'live', 'mixed', 'prize_drop']),
  params: z.object({
    geo:          z.string().min(2).max(3),
    lic:          z.enum(['auto','mga','ukgc','dga','bets_br','segob','coljuegos','mincetur','curacao','anjouan','kahnawake','gibraltar','isle_of_man','none']).default('auto'),
    segment:      z.enum(['all','new','vip','dormant','depositors']).default('all'),
    totalPlayers: z.number().int().min(100).max(500_000).default(5000),
    entryModel:   z.enum(['freeroll','buyin','ticket']),
    scoring:      z.enum(['total_wins','highest_multiplier','most_spins','mission_based']),
    duration:     z.enum(['flash','daily','weekly','monthly','multi_round']),
    prizePool:    z.number().positive(),
    poolModel:    z.enum(['fixed','dynamic','hybrid']),
    rake:         z.number().min(0).max(40).optional(),
    distribution: z.enum(['top_n','linear_decay','flat_tier','prize_drop']),
    reentry:      z.enum(['single','rebuy','unlimited']),
    currency:     z.string().min(2).max(5).optional(),
    lang:         z.string().min(2).max(5).default('en'),
    tone:         z.enum(['professional','casual','hype']).default('professional'),
  }),
});

export const TournamentTextsSchema = z.object({
  type:   z.string(),
  params: z.record(z.string(), z.unknown()),
  spec:   z.record(z.string(), z.unknown()),
});

export const TournamentAuditSchema = z.object({
  type:   z.string(),
  params: z.record(z.string(), z.unknown()),
  spec:   z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const TournamentDescriptionSchema = z.object({
  type:   z.string(),
  params: z.record(z.string(), z.unknown()),
  spec:   z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const TournamentGamesSchema = z.object({
  geo:     z.string().min(2).max(3),
  segment: z.enum(['all','new','vip','dormant','depositors']).default('all'),
  type:    z.enum(['slot','live','mixed','prize_drop']),
  scoring: z.enum(['total_wins','highest_multiplier','most_spins','mission_based']),
  plat:    z.enum(['mobile','desk','both']).optional(),
  uiLang:  z.string().optional(),
});

const TournamentOptimizeEconSchema = z.object({
  arpu:                  z.number(),
  eligible:              z.number(),
  durationDays:          z.number(),
  engagementMultiplier:  z.number(),
  participantsMid:       z.number(),
  ggrLiftMid:            z.number(),
  retentionValue:        z.number(),
  prizePoolCost:         z.number(),
  netMarginMid:          z.number(),
  totalValueMid:         z.number(),
  roi:                   z.number(),
  breakEvenParticipants: z.number(),
  costPerActiveMid:      z.number(),
});

export const TournamentOptimizeSchema = z.object({
  type:   z.string(),
  params: z.record(z.string(), z.unknown()),
  econ:   TournamentOptimizeEconSchema,
  mode:   z.enum(['optimize', 'review']),
  uiLang: z.string().optional(),
});

export type TournamentGenerateInput = z.infer<typeof TournamentGenerateSchema>;
export type TournamentTextsInput       = z.infer<typeof TournamentTextsSchema>;
export type TournamentAuditInput       = z.infer<typeof TournamentAuditSchema>;
export type TournamentDescriptionInput = z.infer<typeof TournamentDescriptionSchema>;
export type TournamentGamesInput    = z.infer<typeof TournamentGamesSchema>;
export type TournamentOptimizeInput = z.infer<typeof TournamentOptimizeSchema>;
