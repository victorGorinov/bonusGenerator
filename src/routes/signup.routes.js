import { Router }        from 'express';
import { signupLimiter } from '../middleware/rateLimiter.js';
import { validate }      from '../middleware/validate.js';
import { SignupSchema }  from '../validation/signup.schema.js';
import * as ctrl         from '../controllers/signup.controller.js';

const router = Router();
router.post('/signup', signupLimiter, validate(SignupSchema), ctrl.signup);
export default router;
