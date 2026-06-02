import { asyncHandler }               from '../middleware/asyncHandler.js';
import { AIProviderError }             from '../errors/AIProviderError.js';
import { generateLoyaltyConfig, recalcLoyaltyConfig, generateLoyaltyTexts, auditLoyalty, optimizeLoyalty } from '../use-cases/GenerateLoyalty.js';
import type { AIProvider }             from '../ai/interface.js';
import type { LoyaltyGenerateInput, LoyaltyRecalcInput, LoyaltyTextsInput, LoyaltyAuditInput, LoyaltyOptimizeInput } from '../validation/loyalty.schema.js';

interface Deps { ai: AIProvider }

export function createLoyaltyController({ ai }: Deps) {
  return {
    generate: asyncHandler<Record<string, never>, unknown, LoyaltyGenerateInput>(
      async (req, res) => {
        res.json(generateLoyaltyConfig(req.body));
      },
    ),

    recalc: asyncHandler<Record<string, never>, unknown, LoyaltyRecalcInput>(
      async (req, res) => {
        res.json(recalcLoyaltyConfig(req.body));
      },
    ),

    texts: asyncHandler<Record<string, never>, unknown, LoyaltyTextsInput>(
      async (req, res) => {
        try {
          res.json(await generateLoyaltyTexts(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    audit: asyncHandler<Record<string, never>, unknown, LoyaltyAuditInput>(
      async (req, res) => {
        try {
          res.json(await auditLoyalty(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    optimize: asyncHandler<Record<string, never>, unknown, LoyaltyOptimizeInput>(
      async (req, res) => {
        try {
          res.json(await optimizeLoyalty(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
