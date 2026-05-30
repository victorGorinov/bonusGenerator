import { Router }                       from 'express';
import { campaignLimiter, aiLimiter }   from '../middleware/rateLimiter.js';
import { validate }                     from '../middleware/validate.js';
import { CampaignGenerateSchema }       from '../validation/campaign.schema.js';
import { TextsSchema }                  from '../validation/texts.schema.js';
import { AuditSchema }                  from '../validation/audit.schema.js';
import { OptimizeSchema }               from '../validation/optimize.schema.js';
import { createCampaignController }     from '../controllers/campaign.controller.js';
import { getAIProvider }                from '../ai/registry.js';

const ctrl   = createCampaignController({ ai: getAIProvider() });
const router = Router();
router.post('/generate',  campaignLimiter, validate(CampaignGenerateSchema), ctrl.generate);
router.post('/texts',     aiLimiter,       validate(TextsSchema),             ctrl.texts);
router.post('/audit',     aiLimiter,       validate(AuditSchema),             ctrl.audit);
router.post('/optimize',  aiLimiter,       validate(OptimizeSchema),          ctrl.optimize);
export default router;
