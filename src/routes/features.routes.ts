import { Router } from 'express';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { createAccessController } from '../controllers/access.controller.js';
import { pool } from '../db/client.js';

const ctrl = createAccessController({ db: pool });
const router = Router();

// Public: guests need this to know their allowed tools too.
router.get('/features', optionalAuth, ctrl.features);

export default router;
