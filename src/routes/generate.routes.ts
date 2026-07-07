import { Router }                      from 'express';
import { apiLimiter }                  from '../middleware/rateLimiter.js';
import { validate }                    from '../middleware/validate.js';
import { GenerateSchema }              from '../validation/generate.schema.js';
import { RecalcSchema }                from '../validation/recalc.schema.js';
import { createGenerateController }    from '../controllers/generate.controller.js';
import { requireFeature }              from '../middleware/requireFeature.js';

const ctrl   = createGenerateController();
const router = Router();
// Mounted at /api (broad prefix) so requireFeature is attached per-route here,
// not at the mount, to avoid gating sibling /api/* routers behind 'bonus'.
router.post('/generate', apiLimiter, requireFeature('bonus'), validate(GenerateSchema), ctrl.generate);
router.post('/recalc',   apiLimiter, requireFeature('bonus'), validate(RecalcSchema),   ctrl.recalc);
export default router;
