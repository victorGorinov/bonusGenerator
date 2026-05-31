import { z } from 'zod';

export const ActualsSchema = z.object({
  enteredAt: z.string().datetime().optional(),
  source: z.enum(['manual', 'csv', 'api']).default('manual'),
  participants: z.number().int().min(0),
  totalDeposits: z.number().min(0),
  wagerCompleted: z.number().min(0).max(1),
  bonusPayout: z.number().min(0),
  incrPlayers: z.number().int().min(0).optional(),
  incrRevenue: z.number().optional(),
  notes: z.string().max(500).optional(),
});

export type ActualsInput = z.infer<typeof ActualsSchema>;

export const ForecastSnapshotSchema = z.object({
  capturedAt: z.string().datetime(),
  geo: z.string(),
  segment: z.enum(['new', 'mid', 'vip']),
  lic: z.string(),
  cur: z.string(),
  pl: z.number().int().min(1),
  costRatio: z.number().min(0),
  sP10: z.number().min(0),
  sP50: z.number().min(0),
  sP90: z.number().min(0),
  conv: z.object({
    p10: z.number().min(0).max(1),
    p50: z.number().min(0).max(1),
    p90: z.number().min(0).max(1),
  }),
  lift: z.number().min(0).max(0.4),
  incrPl: z.number().min(0),
  incrRev: z.number(),
  campCost3: z.number().min(0),
  net: z.number(),
});

export type ForecastSnapshotInput = z.infer<typeof ForecastSnapshotSchema>;

// Request to analyze campaign: POST /api/campaign/analysis
export const AnalysisSchema = z.object({
  forecastSnapshot: ForecastSnapshotSchema,
  actuals: ActualsSchema,
});

export type AnalysisInput = z.infer<typeof AnalysisSchema>;
