import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { analyzeCampaign } from '../services/analytics.service.js';
import { explainDivergence } from '../services/analytics.service.js';
import { getAIProvider } from '../ai/registry.js';
import type { AnalysisInput, ActualsInput, ExplainInput } from '../validation/analysis.schema.js';

export const createAnalyticsController = () => {
  const analyze = asyncHandler<Record<string, never>, unknown, AnalysisInput>(async (req: Request, res: Response) => {
    const { forecastSnapshot, actuals } = req.body;
    const comparison = analyzeCampaign(forecastSnapshot, actuals);
    res.json(comparison);
  });

  const saveActuals = asyncHandler<Record<string, never>, unknown, ActualsInput>(async (req: Request, res: Response) => {
    // Phase 1: just validate and echo back (no DB)
    // Phase 2+: persist to DB
    res.json({ success: true, actuals: req.body, message: 'Actuals saved (Phase 1: client-side only)' });
  });

  const explain = asyncHandler<Record<string, never>, unknown, ExplainInput>(async (req: Request, res: Response) => {
    const { comparison } = req.body;
    const ai = getAIProvider();
    const explanation = await explainDivergence(comparison, ai);
    res.json({ explanation });
  });

  return { analyze, saveActuals, explain };
};
