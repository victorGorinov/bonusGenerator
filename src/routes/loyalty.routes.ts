import { Router }                      from 'express';
import { campaignLimiter, apiLimiter, aiLimiter } from '../middleware/rateLimiter.js';
import { validate }                    from '../middleware/validate.js';
import { LoyaltyGenerateSchema, LoyaltyRecalcSchema, LoyaltyTextsSchema, LoyaltyAuditSchema, LoyaltyOptimizeSchema, LoyaltyMissionsSchema, LoyaltyDescriptionSchema } from '../validation/loyalty.schema.js';
import { createLoyaltyController }     from '../controllers/loyalty.controller.js';
import { getAIProvider }               from '../ai/registry.js';
import { requireFeature }              from '../middleware/requireFeature.js';

const ctrl   = createLoyaltyController({ ai: getAIProvider() });
const router = Router();
router.use(requireFeature('loyalty'));
router.post('/generate', campaignLimiter, validate(LoyaltyGenerateSchema),  ctrl.generate);
router.post('/recalc',   apiLimiter,      validate(LoyaltyRecalcSchema),    ctrl.recalc);
router.post('/texts',    aiLimiter,       validate(LoyaltyTextsSchema),     ctrl.texts);
router.post('/description', aiLimiter,     validate(LoyaltyDescriptionSchema), ctrl.description);
router.post('/audit',    aiLimiter,       validate(LoyaltyAuditSchema),     ctrl.audit);
router.post('/optimize', aiLimiter,       validate(LoyaltyOptimizeSchema),  ctrl.optimize);
router.post('/missions', aiLimiter,       validate(LoyaltyMissionsSchema),  ctrl.missions);
export default router;
