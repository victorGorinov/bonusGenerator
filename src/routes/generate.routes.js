import { Router }       from 'express';
import { apiLimiter }   from '../middleware/rateLimiter.js';
import * as ctrl        from '../controllers/generate.controller.js';

const router = Router();
router.post('/generate', apiLimiter, ctrl.generate);
router.post('/recalc',   apiLimiter, ctrl.recalc);
export default router;
