import { Router }                     from 'express';
import { aiLimiter }                  from '../middleware/rateLimiter.js';
import { validate }                   from '../middleware/validate.js';
import { CompetitorSearchSchema, CompetitorCompareSchema } from '../validation/competitor.schema.js';
import { createCompetitorController } from '../controllers/competitor.controller.js';
import { getAIProvider }              from '../ai/registry.js';
import { requireFeature }             from '../middleware/requireFeature.js';
import { aiGate }                     from '../middleware/aiBudget.js';

const ctrl   = createCompetitorController({ ai: getAIProvider() });
const router = Router();

// Mounted at /api/competitor → gate the whole router. Closed to guests
// (competitorComparison ∉ GUEST_FEATURES) because live web search costs per call.
// Both endpoints are AI (Sonnet + web search — the priciest path), so the whole
// router also requires the `ai` grant and passes the budget/quota kill-switch.
router.use(requireFeature('competitorComparison'), ...aiGate);

router.post('/search',  aiLimiter, validate(CompetitorSearchSchema),  ctrl.search);
router.post('/compare', aiLimiter, validate(CompetitorCompareSchema), ctrl.compare);

export default router;
