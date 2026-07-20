import { asyncHandler }     from '../middleware/asyncHandler.js';
import { AIProviderError }   from '../errors/AIProviderError.js';
import { searchCompetitorBonus, compareCompetitorOffers } from '../use-cases/GenerateCompetitorComparison.js';
import type { AIProvider }   from '../ai/interface.js';
import type { CompetitorSearchInput, CompetitorCompareInput } from '../validation/competitor.schema.js';

interface Deps { ai: AIProvider }

export function createCompetitorController({ ai }: Deps) {
  return {
    search: asyncHandler<Record<string, never>, unknown, CompetitorSearchInput>(
      async (req, res) => {
        try {
          res.json(await searchCompetitorBonus(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    compare: asyncHandler<Record<string, never>, unknown, CompetitorCompareInput>(
      async (req, res) => {
        try {
          res.json(await compareCompetitorOffers(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
