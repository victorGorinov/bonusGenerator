import { asyncHandler }     from '../middleware/asyncHandler.js';
import { AIProviderError }   from '../errors/AIProviderError.js';
import { generateWheel, generateWheelTexts, generateWheelDescription, auditWheel, optimizeWheel } from '../use-cases/GenerateWheel.js';
import type { AIProvider }   from '../ai/interface.js';
import type { WheelGenerateInput, WheelTextsInput, WheelAuditInput, WheelOptimizeInput, WheelDescriptionInput } from '../validation/wheel.schema.js';

interface Deps { ai: AIProvider }

export function createWheelController({ ai }: Deps) {
  return {
    generate: asyncHandler<Record<string, never>, unknown, WheelGenerateInput>(
      async (req, res) => {
        res.json(generateWheel(req.body));
      },
    ),

    texts: asyncHandler<Record<string, never>, unknown, WheelTextsInput>(
      async (req, res) => {
        try {
          res.json(await generateWheelTexts(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    description: asyncHandler<Record<string, never>, unknown, WheelDescriptionInput>(
      async (req, res) => {
        try {
          res.json(await generateWheelDescription(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    audit: asyncHandler<Record<string, never>, unknown, WheelAuditInput>(
      async (req, res) => {
        try {
          res.json(await auditWheel(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    optimize: asyncHandler<Record<string, never>, unknown, WheelOptimizeInput>(
      async (req, res) => {
        try {
          res.json(await optimizeWheel(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
