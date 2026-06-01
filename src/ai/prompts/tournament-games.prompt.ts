import type { Game } from '../../config/games/catalog.js';

interface GamesPromptParams {
  region:   string;
  geo:      string;
  segment:  string;
  type:     string;
  scoring:  string;
  primary:  Game[];
}

export function buildGamesPrompt({ region, geo, segment, type, scoring, primary }: GamesPromptParams): string {
  const gameList = primary
    .map(g => `- ${g.name} (${g.provider}) | mechanic:${g.mechanic} | vol:${g.volatility} | RTP:${g.rtp}%`)
    .join('\n');

  return `You are a casino product specialist. A tournament has been configured and a deterministic algorithm selected these games. Write a brief rationale (1 short paragraph) explaining why this game pool fits the audience, and a one-liner "why it fits" for each game.

Tournament context:
- Region: ${region} (${geo})
- Player segment: ${segment}
- Tournament type: ${type}
- Scoring model: ${scoring}

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
