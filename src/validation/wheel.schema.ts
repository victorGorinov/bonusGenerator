import { z } from 'zod';

const WheelSegmentSchema = z.object({
  labelKey:   z.string().optional(),
  prizeType:  z.enum(['bonus_money', 'free_spins', 'cashback', 'multiplier', 'jackpot', 'physical', 'nothing']),
  weight:     z.number().min(0).max(1000),
  prizeValue: z.number().min(0),
});

export const WheelGenerateSchema = z.object({
  params: z.object({
    geo:        z.string().min(2).max(3),
    lic:        z.enum(['auto','mga','ukgc','dga','bets_br','segob','coljuegos','mincetur','curacao','anjouan','kahnawake','gibraltar','isle_of_man','none']).default('auto'),
    segment:    z.enum(['all','new','vip','dormant','depositors']).default('depositors'),
    preset:     z.enum(['welcome','daily','vip']).default('welcome'),
    frequency:  z.enum(['on_deposit','daily','weekly','one_time']).optional(),
    players:    z.number().int().min(100).max(500_000).default(5000),
    avgDeposit: z.number().positive().optional(),
    segments:   z.array(WheelSegmentSchema).min(2).max(12).optional(),
    rtp:        z.number().min(0.5).max(0.99).optional(),
    wager:      z.number().min(0).max(100).optional(),
    currency:   z.string().min(2).max(5).optional(),
    lang:       z.string().min(2).max(5).default('en'),
    tone:       z.enum(['professional','casual','hype']).default('professional'),
  }),
});

export const WheelTextsSchema = z.object({
  params: z.record(z.string(), z.unknown()),
  spec:   z.record(z.string(), z.unknown()),
});

export const WheelAuditSchema = z.object({
  params: z.record(z.string(), z.unknown()),
  spec:   z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const WheelDescriptionSchema = z.object({
  params: z.record(z.string(), z.unknown()),
  spec:   z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

const WheelOptimizeEconSchema = z.object({
  evPerSpin:             z.number(),
  participantsMid:       z.number(),
  spinsPerParticipant:   z.number(),
  programCostMid:        z.number(),
  ggrUpliftMid:          z.number(),
  retentionValue:        z.number(),
  totalValueMid:         z.number(),
  netResultMid:          z.number(),
  roi:                   z.number(),
  costRatio:             z.number(),
  costPerActiveMid:      z.number(),
  maxRisk:               z.number(),
  breakEvenParticipants: z.number(),
});

export const WheelOptimizeSchema = z.object({
  params: z.record(z.string(), z.unknown()),
  econ:   WheelOptimizeEconSchema,
  uiLang: z.string().optional(),
});

export type WheelGenerateInput = z.infer<typeof WheelGenerateSchema>;
export type WheelTextsInput    = z.infer<typeof WheelTextsSchema>;
export type WheelAuditInput       = z.infer<typeof WheelAuditSchema>;
export type WheelDescriptionInput = z.infer<typeof WheelDescriptionSchema>;
export type WheelOptimizeInput  = z.infer<typeof WheelOptimizeSchema>;
