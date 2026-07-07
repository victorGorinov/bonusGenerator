import { Router } from 'express';
import { savedLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createRequireWorkspace } from '../middleware/requireWorkspace.js';
import { createRequireActiveUser } from '../middleware/requireActiveUser.js';
import { createSavedItemsController } from '../controllers/savedItems.controller.js';
import { pool } from '../db/client.js';

// Generic per-workspace persistence, one handler set for all six entities.
// entity ∈ configs | campaigns | tournaments | loyalty-programs |
//          calendar-events | calendar-templates  (validated in the use-case).
const ctrl = createSavedItemsController({ db: pool });
const requireWorkspace = createRequireWorkspace({ db: pool });
const requireActiveUser = createRequireActiveUser({ db: pool });
const router = Router();

router.use(savedLimiter, requireAuth, requireActiveUser, requireWorkspace);

router.get('/:entity',        ctrl.list);
router.post('/:entity',       ctrl.save);
router.delete('/:entity/:id', ctrl.remove);

export default router;
