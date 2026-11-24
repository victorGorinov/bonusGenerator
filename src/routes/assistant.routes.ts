import { Router }                     from 'express';
import { aiLimiter }                   from '../middleware/rateLimiter.js';
import { validate }                    from '../middleware/validate.js';
import { AssistantInterpretSchema }    from '../validation/assistant.schema.js';
import { createAssistantController }   from '../controllers/assistant.controller.js';
import { getAIProvider }               from '../ai/registry.js';
import { aiGate }                      from '../middleware/aiBudget.js';

const ctrl   = createAssistantController({ ai: getAIProvider() });
const router = Router();

// NL interpretation is an AI action → aiGate (requireFeature('ai') + budget/quota).
// optionalAuth is applied at the mount (toolAuth), so req.user is present for aiGate.
router.post('/interpret', aiLimiter, ...aiGate, validate(AssistantInterpretSchema), ctrl.interpret);

export default router;
