import { z } from 'zod';

export const LoyaltyGenerateSchema = z.object({
  mode:            z.enum(['tiers', 'missions', 'hybrid']).default('hybrid'),
  numTiers:        z.union([z.literal(3), z.literal(4), z.literal(5)]).default(5),
  topCashbackRate: z.number().min(0).max(0.30).default(0.10),
  earnRateDeposit: z.number().min(1).max(50).default(10),
  earnRateWager:   z.number().min(0).max(10).default(1),
  redeemRate:      z.number().min(10).max(1000).default(100),
  redeemMinPoints: z.number().int().min(0).default(1000),
  pointsExpiry:    z.number().int().min(0).max(24).default(0),
  missionCount:    z.number().int().min(0).max(6).default(3),
  region:          z.string().min(2).max(10),
  segment:         z.enum(['new', 'mid', 'vip']).default('mid'),
  players:         z.number().int().min(100).max(500_000).default(5000),
  avgdep:          z.number().positive().default(100),
  arpu:            z.number().positive().default(50),
});

export const LoyaltyRecalcSchema = LoyaltyGenerateSchema;

export const LoyaltyTextsSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  econ:   z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const LoyaltyAuditSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const LoyaltyDescriptionSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const LoyaltyOptimizeSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  econ:   z.record(z.string(), z.unknown()),
  uiLang: z.string().optional(),
});

export const LoyaltyMissionsSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  econ:   z.record(z.string(), z.unknown()).optional(),
  uiLang: z.string().optional(),
});

export type LoyaltyGenerateInput  = z.infer<typeof LoyaltyGenerateSchema>;
export type LoyaltyRecalcInput    = z.infer<typeof LoyaltyRecalcSchema>;
export type LoyaltyTextsInput     = z.infer<typeof LoyaltyTextsSchema>;
export type LoyaltyAuditInput       = z.infer<typeof LoyaltyAuditSchema>;
export type LoyaltyDescriptionInput = z.infer<typeof LoyaltyDescriptionSchema>;
export type LoyaltyOptimizeInput  = z.infer<typeof LoyaltyOptimizeSchema>;
export type LoyaltyMissionsInput  = z.infer<typeof LoyaltyMissionsSchema>;
