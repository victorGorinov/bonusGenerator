import { z } from 'zod';

const ActivitySummarySchema = z.object({
  title:     z.string(),
  promoType: z.enum(['bonus', 'tournament', 'loyalty']),
  geo:       z.string(),
  segment:   z.string(),
  econ:      z.record(z.string(), z.unknown()).nullable(),
  params:    z.record(z.string(), z.unknown()),
});

const ForecastSummarySchema = z.object({
  gross:       z.number(),
  overlapLoss: z.number(),
  net:         z.number(),
  netProfit:   z.number(),
  coverage:    z.object({
    total:    z.number(),
    withEcon: z.number(),
  }),
});

export const ReportSummarySchema = z.object({
  type:       z.enum(['single', 'comparison', 'period']),
  activities: z.array(ActivitySummarySchema).min(1).max(10),
  forecast:   ForecastSummarySchema.optional(),
  uiLang:     z.enum(['en', 'ru']).default('en'),
});

export type ReportSummaryInput = z.infer<typeof ReportSummarySchema>;
