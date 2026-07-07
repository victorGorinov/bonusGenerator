import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { AdminUpdateUserSchema, AdminListQuerySchema } from '../validation/admin.schema.js';
import { createAdminController } from '../controllers/admin.controller.js';
import { pool } from '../db/client.js';

const ctrl = createAdminController({ db: pool });
const router = Router();

// Every admin route is gated: requireAdmin resolves the cookie and checks
// role='admin' from the DB (immediate revocation). apiLimiter for cheap DB ops.
router.use(apiLimiter, requireAdmin);

router.get('/meta',         ctrl.meta);
router.get('/users',        validateQuery(AdminListQuerySchema), ctrl.list);
router.get('/users/:id',    ctrl.get);
router.patch('/users/:id',  validate(AdminUpdateUserSchema), ctrl.update);
router.delete('/users/:id', ctrl.remove);

export default router;
