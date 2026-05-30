import { Router }                      from 'express';
import { campaignLimiter, aiLimiter }  from '../middleware/rateLimiter.js';
import { validate }                    from '../middleware/validate.js';
import { TournamentGenerateSchema, TournamentTextsSchema, TournamentAuditSchema } from '../validation/tournament.schema.js';
import { createTournamentController }  from '../controllers/tournament.controller.js';
import { getAIProvider }               from '../ai/registry.js';

const ctrl   = createTournamentController({ ai: getAIProvider() });
const router = Router();
router.post('/generate', campaignLimiter, validate(TournamentGenerateSchema), ctrl.generate);
router.post('/texts',    aiLimiter,       validate(TournamentTextsSchema),    ctrl.texts);
router.post('/audit',    aiLimiter,       validate(TournamentAuditSchema),    ctrl.audit);
export default router;
