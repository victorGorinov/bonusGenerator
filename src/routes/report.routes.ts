import { Router }                   from 'express';
import { aiLimiter }               from '../middleware/rateLimiter.js';
import { validate }                from '../middleware/validate.js';
import { ReportSummarySchema }     from '../validation/report.schema.js';
import { createReportController }  from '../controllers/report.controller.js';
import { getAIProvider }           from '../ai/registry.js';

const ctrl   = createReportController({ ai: getAIProvider() });
const router = Router();
router.post('/summary', aiLimiter, validate(ReportSummarySchema), ctrl.summary);
export default router;
