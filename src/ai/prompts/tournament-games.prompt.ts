import type { Game } from '../../config/games/catalog.js';

const GEO_NAME: Record<string, string> = {
  de: 'Germany',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  nl: 'Netherlands',
  dk: 'Denmark',
  uk: 'United Kingdom',
  ru: 'Russia',
  kz: 'Kazakhstan',
  us: 'United States (sweepstakes)',
  mn: 'Mongolia',
  mx: 'Mexico',
  br: 'Brazil',
};

const REGION_NAME: Record<string, string> = {
  eu:     'European Union / UK',
  cis:    'CIS (Russia/Kazakhstan)',
  crypto: 'Global Crypto',
  sweep:  'US Sweepstakes',
  mn:     'Mongolia',
  latam:  'Latin America',
};

const SEGMENT_NAME: Record<string, string> = {
  all:        'all players',
  new:        'new players (first-timers)',
  mid:        'regular mid-value players',
  vip:        'VIP high-value players',
  dormant:    'dormant / reactivation players',
  depositors: 'active depositors',
};

const TYPE_NAME: Record<string, string> = {
  slot:       'Slots',
  live:       'Live Casino',
  mixed:      'Mixed (slots + live)',
  prize_drop: 'Prize Drop',
};

const SCORING_NAME: Record<string, string> = {
  total_wins:          'Total wins leaderboard',
  highest_multiplier:  'Highest multiplier',
  most_spins:          'Most spins',
  mission_based:       'Mission-based scoring',
};

interface GamesPromptParams {
  region:   string;
  geo:      string;
  segment:  string;
  type:     string;
  scoring:  string;
  primary:  Game[];
}

export function buildGamesPrompt({ region, geo, segment, type, scoring, primary }: GamesPromptParams): string {
  const countryName  = GEO_NAME[geo]  ?? geo.toUpperCase();
  const regionName   = REGION_NAME[region] ?? region;
  const segmentName  = SEGMENT_NAME[segment] ?? segment;
  const typeName     = TYPE_NAME[type]   ?? type;
  const scoringName  = SCORING_NAME[scoring] ?? scoring;

  const gameList = primary
    .map(g => `- ${g.name} (${g.provider}) | mechanic:${g.mechanic} | volatility:${g.volatility} | RTP:${g.rtp}%`)
    .join('\n');

  return `You are a casino product specialist. A tournament has been configured and a deterministic algorithm selected these games. Write a brief rationale (1 short paragraph) explaining why this game pool fits the audience, and a one-liner "why it fits" for each game.

Tournament context:
- Country: ${countryName}
- Region: ${regionName}
- Player segment: ${segmentName}
- Tournament type: ${typeName}
- Scoring model: ${scoringName}

Selected games:
${gameList}

Respond ONLY with valid JSON matching this exact schema:
{
  "rationale": "<1 paragraph, max 80 words, why this pool fits segment + region>",
  "games": [
    { "id": "<game id>", "why": "<one sentence, max 15 words>" }
  ]
}

Game ids must exactly match the input list in order. No extra fields, no markdown.`;
}
