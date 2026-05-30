import { asyncHandler }                   from '../middleware/asyncHandler.js';
import { AIProviderError }                from '../errors/AIProviderError.js';
import { generateTournament, generateTournamentTexts, auditTournament } from '../use-cases/GenerateTournament.js';
import type { AIProvider }                from '../ai/interface.js';
import type { TournamentGenerateInput, TournamentTextsInput, TournamentAuditInput } from '../validation/tournament.schema.js';

interface Deps { ai: AIProvider }

export function createTournamentController({ ai }: Deps) {
  return {
    generate: asyncHandler<Record<string, never>, unknown, TournamentGenerateInput>(
      async (req, res) => {
        res.json(generateTournament(req.body));
      },
    ),

    texts: asyncHandler<Record<string, never>, unknown, TournamentTextsInput>(
      async (req, res) => {
        try {
          res.json(await generateTournamentTexts(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    audit: asyncHandler<Record<string, never>, unknown, TournamentAuditInput>(
      async (req, res) => {
        try {
          res.json(await auditTournament(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
