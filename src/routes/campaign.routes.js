import { Router }                           from 'express';
import { campaignLimiter, aiLimiter }       from '../middleware/rateLimiter.js';
import * as ctrl                            from '../controllers/campaign.controller.js';

const router = Router();
router.post('/generate', campaignLimiter, ctrl.generate);
router.post('/texts',    aiLimiter,       ctrl.texts);
router.post('/audit',    aiLimiter,       ctrl.audit);
export default router;
