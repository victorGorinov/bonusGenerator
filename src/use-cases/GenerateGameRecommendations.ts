import { recommendGames }        from '../domain/games/recommendGames.js';
import { groupGamesBySection }   from '../domain/games/sections.js';
import { GEO_CFG }               from '../domain/campaign/scenarios.js';
import type { GamesRecommendInput } from '../validation/games.schema.js';
import type { Game }             from '../config/games/catalog.js';
import type { GameSections }     from '../domain/games/sections.js';

const SECTION_LIMIT = 8;

function capSections(sections: GameSections): GameSections {
  return {
    popular:        sections.popular.slice(0, SECTION_LIMIT),
    live:           sections.live.slice(0, SECTION_LIMIT),
    fast:           sections.fast.slice(0, SECTION_LIMIT),
    highVolatility: sections.highVolatility.slice(0, SECTION_LIMIT),
    mobileFriendly: sections.mobileFriendly.slice(0, SECTION_LIMIT),
  };
}

export interface GameRecommendationsResult {
  sections: GameSections;
  scores:   Record<string, number>;
  region:   string;
  all:      Game[];
}

/**
 * Deterministic, no-AI game recommendations for CRM/campaign contexts (bonus,
 * campaign, loyalty) — as opposed to recommendTournamentGames in
 * GenerateTournament.ts, which is scoped to a specific tournament type +
 * scoring model. This entry point has no mechanic gate: region + segment +
 * optional connected-providers filter only, then grouped into lobby-style
 * sections for merchandising in campaign copy / configurator panels.
 */
export function recommendGamesForContext(input: GamesRecommendInput): GameRecommendationsResult {
  const { geo, segment, providers, plat } = input;
  const region = GEO_CFG[geo]?.region ?? geo;

  const { all, scores } = recommendGames({ geo, region, segment, providers, plat });
  const sections = capSections(groupGamesBySection(all));

  return { sections, scores, region, all };
}
