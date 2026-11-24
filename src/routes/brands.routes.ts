import { Router } from 'express';
import { savedLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createRequireWorkspace } from '../middleware/requireWorkspace.js';
import { createRequireActiveUser } from '../middleware/requireActiveUser.js';
import { createBrandsController } from '../controllers/brands.controller.js';
import { pool } from '../db/client.js';

// Brand profiles + account profile. Account-scoped data, so the same guard chain
// as /api/saved: authenticated, not disabled, workspace resolved. No feature flag
// — the profile is available to every registered user; the tariff differentiates
// via the brand QUOTA (PLAN_LIMITS), not via access.
const ctrl = createBrandsController({ db: pool });
const requireWorkspace = createRequireWorkspace({ db: pool });
const requireActiveUser = createRequireActiveUser({ db: pool });
const router = Router();

router.use(savedLimiter, requireAuth, requireActiveUser, requireWorkspace);

// /profile is declared before /:id so "profile" is never read as a brand id.
router.get('/profile',    ctrl.profile);
router.patch('/profile',  ctrl.saveProfile);

router.get('/',           ctrl.list);
router.post('/',          ctrl.create);
router.patch('/:id',      ctrl.update);
router.delete('/:id',     ctrl.remove);

export default router;
