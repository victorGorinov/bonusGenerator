import { asyncHandler }              from '../middleware/asyncHandler.js';
import { recommendGamesForContext }  from '../use-cases/GenerateGameRecommendations.js';
import type { GamesRecommendInput }  from '../validation/games.schema.js';

export function createGamesController() {
  return {
    recommend: asyncHandler<Record<string, never>, unknown, GamesRecommendInput>(
      async (req, res) => {
        res.json(recommendGamesForContext(req.body));
      },
    ),
  };
}
