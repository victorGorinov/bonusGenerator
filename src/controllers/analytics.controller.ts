import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { AnalysisSchema, ActualsSchema } from '../validation/analysis.schema.js';
import { analyzeCampaign } from '../services/analytics.service.js';
import type { AnalysisInput, ActualsInput } from '../validation/analysis.schema.js';

export const createAnalyticsController = () => {
  const analyze = asyncHandler<{}, {}, AnalysisInput>(async (req: Request, res: Response) => {
    const { forecastSnapshot, actuals } = req.body;
    const comparison = analyzeCampaign(forecastSnapshot, actuals);
    res.json(comparison);
  });

  const saveActuals = asyncHandler<{}, {}, ActualsInput>(async (req: Request, res: Response) => {
    // Phase 1: just validate and echo back (no DB)
    // Phase 2+: persist to DB
    res.json({ success: true, actuals: req.body, message: 'Actuals saved (Phase 1: client-side only)' });
  });

  return { analyze, saveActuals };
};
