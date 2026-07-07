import { loadCatalog, type Game } from '../../config/games/catalog.js';
import { GEO_CFG } from '../campaign/scenarios.js';

// Low-denomination regions where high minBet is a barrier. Keyed on the
// resolved region (not the raw geo) so it fires for both country-code call
// sites (ru/kz → 'cis', mn → 'mn') and region-level ones (loyalty/CRM, which
// pass a region such as 'cis' directly as geo).
const LOW_DENOM_REGIONS = new Set(['cis', 'mn']);

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

function passesMechanicGate(game: Game, type: string | undefined): boolean {
  if (!type) return true; // no mechanic filter requested — allow everything
  if (type === 'live') return game.mechanic === 'live' || game.mechanic === 'table';
  if (type === 'slot') return game.mechanic !== 'live' && game.mechanic !== 'table';
  return true; // mixed | prize_drop — all mechanics allowed
}

function scoringModelBoost(game: Game, scoring: string | undefined): number {
  if (!scoring) return 0; // no scoring-model preference requested
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
  geo:        string;
  region?:    string;   // pre-resolved region; derived from geo via GEO_CFG if omitted
  segment:    string;   // all | new | mid | vip | dormant | depositors
  type?:      string;   // slot | live | mixed | prize_drop — omit for no mechanic gating (e.g. CRM game picks)
  scoring?:   string;   // total_wins | highest_multiplier | most_spins | mission_based — omit for no scoring-model boost
  plat?:      string;   // mobile | desk | both
  providers?: string[]; // restrict to these providers (operator's connected/integrated providers); omit for no filter
}

export interface RecommendResult {
  primary:      Game[];
  alternatives: Game[];
  scores:       Record<string, number>;
  /** Full filtered + scored pool (score desc), not truncated — useful for
   *  section/genre grouping where a top-10 slice would hide entire mechanics. */
  all:          Game[];
}

export function recommendGames(params: RecommendParams): RecommendResult {
  const { geo, segment, type, scoring, plat, providers } = params;
  const region = params.region ?? GEO_CFG[geo]?.region ?? geo;
  const catalog = loadCatalog();
  const isLowDenom = LOW_DENOM_REGIONS.has(region);
  const providerSet = providers && providers.length > 0 ? new Set(providers) : null;

  const scored: { game: Game; score: number }[] = [];

  for (const game of catalog) {
    if (!passesMechanicGate(game, type)) continue;
    if (providerSet && !providerSet.has(game.provider)) continue;

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
    all:          scored.map(s => s.game),
  };
}
