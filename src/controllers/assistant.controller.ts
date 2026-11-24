import { asyncHandler }               from '../middleware/asyncHandler.js';
import { AIProviderError }             from '../errors/AIProviderError.js';
import { interpretPrompt }             from '../use-cases/InterpretPrompt.js';
import type { AIProvider }             from '../ai/interface.js';
import type { AssistantInterpretInput } from '../validation/assistant.schema.js';

interface Deps { ai: AIProvider }

export function createAssistantController({ ai }: Deps) {
  return {
    interpret: asyncHandler<Record<string, never>, unknown, AssistantInterpretInput>(
      async (req, res) => {
        try {
          res.json(await interpretPrompt(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
