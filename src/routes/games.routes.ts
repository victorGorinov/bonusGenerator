import { Router }               from 'express';
import { apiLimiter }           from '../middleware/rateLimiter.js';
import { validate }             from '../middleware/validate.js';
import { GamesRecommendSchema } from '../validation/games.schema.js';
import { createGamesController } from '../controllers/games.controller.js';
import { requireFeature }        from '../middleware/requireFeature.js';

const ctrl   = createGamesController();
const router = Router();
router.use(requireFeature('games'));

// Deterministic, no-AI recommendation — cheap relative to the AI-backed routes,
// hence apiLimiter (30/min) rather than aiLimiter.
router.post('/recommend', apiLimiter, validate(GamesRecommendSchema), ctrl.recommend);

export default router;
