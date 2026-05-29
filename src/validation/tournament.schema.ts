import { z } from 'zod';

export const TournamentGenerateSchema = z.object({
  type:   z.enum(['slot', 'live', 'mixed', 'prize_drop']),
  params: z.object({
    geo:          z.string().min(2).max(3),
    lic:          z.enum(['auto','mga','ukgc','dga','curacao','anjouan','kahnawake','gibraltar','isle_of_man','none']).default('auto'),
    segment:      z.enum(['all','new','vip','dormant','depositors']).default('all'),
    entryModel:   z.enum(['freeroll','buyin','ticket']),
    scoring:      z.enum(['total_wins','highest_multiplier','most_spins','mission_based']),
    duration:     z.enum(['flash','daily','weekly','monthly','multi_round']),
    prizePool:    z.number().positive(),
    poolModel:    z.enum(['fixed','dynamic','hybrid']),
    rake:         z.number().min(0).max(40).optional(),
    distribution: z.enum(['top_n','linear_decay','flat_tier','prize_drop']),
    reentry:      z.enum(['single','rebuy','unlimited']),
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

export type TournamentGenerateInput = z.infer<typeof TournamentGenerateSchema>;
