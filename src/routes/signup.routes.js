import { Router }        from 'express';
import { signupLimiter } from '../middleware/rateLimiter.js';
import * as ctrl         from '../controllers/signup.controller.js';

const router = Router();
router.post('/signup', signupLimiter, ctrl.signup);
export default router;
