import { Router }             from 'express';
import { apiLimiter }         from '../middleware/rateLimiter.js';
import { validate }           from '../middleware/validate.js';
import { GenerateSchema }     from '../validation/generate.schema.js';
import { RecalcSchema }       from '../validation/recalc.schema.js';
import * as ctrl              from '../controllers/generate.controller.js';

const router = Router();
router.post('/generate', apiLimiter, validate(GenerateSchema), ctrl.generate);
router.post('/recalc',   apiLimiter, validate(RecalcSchema),   ctrl.recalc);
export default router;
