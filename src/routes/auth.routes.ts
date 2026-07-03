import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { RegisterSchema, LoginSchema } from '../validation/auth.schema.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { pool } from '../db/client.js';

const ctrl = createAuthController({ db: pool });
const router = Router();

router.post('/register', authLimiter, validate(RegisterSchema), ctrl.register);
router.post('/login',    authLimiter, validate(LoginSchema),    ctrl.login);
router.post('/logout',   ctrl.logout);
router.get('/me',        requireAuth, ctrl.me);

export default router;
