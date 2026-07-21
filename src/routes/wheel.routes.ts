import { Router }                      from 'express';
import { campaignLimiter, aiLimiter }  from '../middleware/rateLimiter.js';
import { validate }                    from '../middleware/validate.js';
import { WheelGenerateSchema, WheelTextsSchema, WheelAuditSchema, WheelOptimizeSchema, WheelDescriptionSchema } from '../validation/wheel.schema.js';
import { createWheelController }        from '../controllers/wheel.controller.js';
import { getAIProvider }                from '../ai/registry.js';
import { requireFeature }               from '../middleware/requireFeature.js';

const ctrl   = createWheelController({ ai: getAIProvider() });
const router = Router();
router.use(requireFeature('wheel'));
router.post('/generate', campaignLimiter, validate(WheelGenerateSchema),  ctrl.generate);
router.post('/texts',    aiLimiter,       validate(WheelTextsSchema),     ctrl.texts);
router.post('/description', aiLimiter,     validate(WheelDescriptionSchema), ctrl.description);
router.post('/audit',    aiLimiter,       validate(WheelAuditSchema),     ctrl.audit);
router.post('/optimize', aiLimiter,       validate(WheelOptimizeSchema),  ctrl.optimize);
export default router;
