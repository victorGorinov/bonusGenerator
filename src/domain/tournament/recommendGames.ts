import { loadCatalog, type Game } from '../../config/games/catalog.js';
import { GEO_CFG } from '../campaign/scenarios.js';

// Low-denomination geos where high minBet is a barrier
const LOW_DENOM_GEOS = new Set(['mn', 'ru', 'kz']);

const W_REGION  = 10;
const W_SEGMENT = 8;
const W_POPULAR = 6;   // max boost for slotRank = 1
const W_MOBILE  = 2;
const PENALTY_MIN_BET = 5;
const PENALTY_VOL_MISMATCH = 3;
const BOOST_SCORING_FIT = 4;

function popularityScore(slotRank: number | null): number {
  if (slotRank === null) return W_POPULAR / 2;
  // rank 1 → full W_POPULAR; rank 30 → 0; clamp beyond
  return Math.max(0, W_POPULAR * (1 - (slotRank - 1) / 29));
}

function passesMechanicGate(game: Game, type: string): boolean {
  if (type === 'live') return game.mechanic === 'live' || game.mechanic === 'table';
  if (type === 'slot') return game.mechanic !== 'live' && game.mechanic !== 'table';
  return true; // mixed | prize_drop — all mechanics allowed
}

function scoringModelBoost(game: Game, scoring: string): number {
  switch (scoring) {
    case 'highest_multiplier':
      if (game.mechanic === 'crash') return BOOST_SCORING_FIT;
      if (game.volatility === 'high') return BOOST_SCORING_FIT / 2;
      if (game.volatility === 'low')  return -PENALTY_VOL_MISMATCH;
      return 0;
    case 'most_spins':
      if (game.mechanic === 'crash') return BOOST_SCORING_FIT;
      if (game.volatility === 'low' || game.volatility === 'mid') return BOOST_SCORING_FIT / 2;
      return 0;
    case 'total_wins':
      // Broad pool; slight boost for popular titles
      return game.slotRank !== null && game.slotRank <= 5 ? 2 : 0;
    case 'mission_based':
      // Feature-rich slots preferred; high volatility fits well
      if (game.mechanic === 'slot' && game.volatility === 'high') return BOOST_SCORING_FIT / 2;
      return 0;
    default:
      return 0;
  }
}

export interface RecommendParams {
  geo:      string;
  region?:  string;   // pre-resolved region; derived from geo via GEO_CFG if omitted
  segment:  string;   // all | new | mid | vip | dormant | depositors
  type:     string;   // slot | live | mixed | prize_drop
  scoring:  string;   // total_wins | highest_multiplier | most_spins | mission_based
  plat?:    string;   // mobile | desk | both
}

export interface RecommendResult {
  primary:      Game[];
  alternatives: Game[];
  scores:       Record<string, number>;
}

export function recommendGames(params: RecommendParams): RecommendResult {
  const { geo, segment, type, scoring, plat } = params;
  const region = params.region ?? GEO_CFG[geo]?.region ?? geo;
  const catalog = loadCatalog();
  const isLowDenom = LOW_DENOM_GEOS.has(geo);

  const scored: { game: Game; score: number }[] = [];

  for (const game of catalog) {
    if (!passesMechanicGate(game, type)) continue;

    let score = 0;

    // Region fit
    if (game.regions.includes(region)) score += W_REGION;

    // Segment fit — 'all' in game.segments covers every segment
    if (game.segments.includes('all') || game.segments.includes(segment)) score += W_SEGMENT;

    // Scoring model fit
    score += scoringModelBoost(game, scoring);

    // Popularity
    score += popularityScore(game.slotRank);

    // minBet penalty for new/low-denom combos
    if (game.minBetTier === 'high' && (segment === 'new' || isLowDenom)) score -= PENALTY_MIN_BET;
    if (game.minBetTier === 'mid'  && isLowDenom)                         score -= PENALTY_MIN_BET / 2;

    // Mobile boost
    if (game.mobile && (plat === 'mobile' || plat === 'both')) score += W_MOBILE;

    scored.push({ game, score });
  }

  // Sort: score desc, then slotRank asc (stable tie-break)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ra = a.game.slotRank ?? 999;
    const rb = b.game.slotRank ?? 999;
    return ra - rb;
  });

  const scores: Record<string, number> = {};
  for (const { game, score } of scored) scores[game.id] = score;

  return {
    primary:      scored.slice(0, 5).map(s => s.game),
    alternatives: scored.slice(5, 10).map(s => s.game),
    scores,
  };
}
