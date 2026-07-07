import type { Game } from '../../config/games/catalog.js';

const POPULAR_RANK_THRESHOLD = 10;

export interface GameSections {
  popular:        Game[];
  live:           Game[];
  fast:           Game[];
  highVolatility: Game[];
  mobileFriendly: Game[];
}

/**
 * Groups a pool of games into casino-lobby-style sections, commonly used for
 * CRM/campaign game merchandising (e.g. "which games to feature"). Buckets are
 * NOT mutually exclusive — a game can appear in multiple sections at once,
 * matching how real casino lobbies present the same title in several rails.
 *
 * Built entirely from existing Game fields (slotRank, mechanic, volatility,
 * mobile) — no catalog schema changes required.
 */
export function groupGamesBySection(games: Game[]): GameSections {
  const popular:        Game[] = [];
  const live:           Game[] = [];
  const fast:           Game[] = [];
  const highVolatility: Game[] = [];
  const mobileFriendly: Game[] = [];

  for (const game of games) {
    if (game.slotRank !== null && game.slotRank <= POPULAR_RANK_THRESHOLD) popular.push(game);
    if (game.mechanic === 'live' || game.mechanic === 'table') live.push(game);
    if (game.mechanic === 'crash') fast.push(game);
    if (game.volatility === 'high') highVolatility.push(game);
    if (game.mobile) mobileFriendly.push(game);
  }

  return { popular, live, fast, highVolatility, mobileFriendly };
}
