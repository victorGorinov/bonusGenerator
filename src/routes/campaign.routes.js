import { Router }                     from 'express';
import { campaignLimiter, aiLimiter } from '../middleware/rateLimiter.js';
import { validate }                   from '../middleware/validate.js';
import { CampaignGenerateSchema }     from '../validation/campaign.schema.js';
import { TextsSchema }                from '../validation/texts.schema.js';
import { AuditSchema }                from '../validation/audit.schema.js';
import * as ctrl                      from '../controllers/campaign.controller.js';

const router = Router();
router.post('/generate', campaignLimiter, validate(CampaignGenerateSchema), ctrl.generate);
router.post('/texts',    aiLimiter,       validate(TextsSchema),             ctrl.texts);
router.post('/audit',    aiLimiter,       validate(AuditSchema),             ctrl.audit);
export default router;
