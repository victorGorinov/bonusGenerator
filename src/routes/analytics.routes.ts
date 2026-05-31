import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { AnalysisSchema, ActualsSchema, ExplainSchema } from '../validation/analysis.schema.js';
import { createAnalyticsController } from '../controllers/analytics.controller.js';
import { apiLimiter, aiLimiter } from '../middleware/rateLimiter.js';

export function createAnalyticsRoutes(): Router {
  const router = Router();
  const { analyze, saveActuals, explain } = createAnalyticsController();

  // POST /api/campaign/analysis — analyze campaign (stateless, no DB)
  router.post('/analysis', apiLimiter, validate(AnalysisSchema), analyze);

  // POST /api/campaign/actuals — save actuals (Phase 1: optional, just validates)
  router.post('/actuals', apiLimiter, validate(ActualsSchema), saveActuals);

  // POST /api/campaign/analysis/explain — AI explanation of divergence
  router.post('/analysis/explain', aiLimiter, validate(ExplainSchema), explain);

  return router;
}
