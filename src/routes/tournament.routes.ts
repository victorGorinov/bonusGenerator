import { Router }                      from 'express';
import { campaignLimiter, aiLimiter }  from '../middleware/rateLimiter.js';
import { validate }                    from '../middleware/validate.js';
import { TournamentGenerateSchema, TournamentTextsSchema, TournamentAuditSchema, TournamentGamesSchema, TournamentOptimizeSchema, TournamentDescriptionSchema } from '../validation/tournament.schema.js';
import { createTournamentController }  from '../controllers/tournament.controller.js';
import { getAIProvider }               from '../ai/registry.js';
import { requireFeature }              from '../middleware/requireFeature.js';
import { aiGate }                      from '../middleware/aiBudget.js';

const ctrl   = createTournamentController({ ai: getAIProvider() });
const router = Router();
router.use(requireFeature('tournament'));
router.post('/generate', campaignLimiter, validate(TournamentGenerateSchema),  ctrl.generate);
router.post('/texts',    aiLimiter, ...aiGate, validate(TournamentTextsSchema),     ctrl.texts);
router.post('/description', aiLimiter, ...aiGate, validate(TournamentDescriptionSchema), ctrl.description);
router.post('/audit',    aiLimiter, ...aiGate, validate(TournamentAuditSchema),     ctrl.audit);
router.post('/games',    aiLimiter, ...aiGate, validate(TournamentGamesSchema),     ctrl.games);
router.post('/optimize', aiLimiter, ...aiGate, validate(TournamentOptimizeSchema),  ctrl.optimize);
export default router;
