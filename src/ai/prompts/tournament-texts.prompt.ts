import { GEO_CFG, LANG_NAME, TONE_DESC } from '../../domain/campaign/scenarios.js';

const ENTRY_MODEL_LABEL: Record<string, string> = {
  freeroll: 'Free entry (freeroll)',
  buyin:    'Buy-in entry',
  ticket:   'Ticket entry',
};

const SCORING_LABEL: Record<string, string> = {
  total_wins:         'Total wins',
  highest_multiplier: 'Highest multiplier',
  most_spins:         'Most spins played',
  mission_based:      'Mission-based scoring',
};

const DIST_LABEL: Record<string, string> = {
  top_n:        'Top-N winners take prizes',
  linear_decay: 'Linear decay prize ladder',
  flat_tier:    'Flat tier (equal prizes per tier)',
  prize_drop:   'Random prize drop during play',
};

const REENTRY_LABEL: Record<string, string> = {
  single:    'single entry',
  rebuy:     'rebuy allowed',
  unlimited: 'unlimited re-entries',
};

interface TournamentTextsParams {
  type:   string;
  params: Record<string, unknown>;
  spec:   Record<string, unknown>;
}

export function buildTournamentTextsPrompt({ type, params, spec }: TournamentTextsParams): string {
  const geo     = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto')
    ? String(params['lic']) : (geo.lic || 'none');
  const lic     = resolvedLic.toUpperCase();
  const lang    = LANG_NAME[String(params['lang'] || 'en')] || 'English';
  const tone    = TONE_DESC[String(params['tone'] || 'professional')] || TONE_DESC['pro'];

  const prizePool  = Number(spec['prizePool']   || params['prizePool']  || 1000);
  const cur        = geo.sitecur;
  const entry      = ENTRY_MODEL_LABEL[String(params['entryModel'] || 'freeroll')] || 'Free entry';
  const scoring    = SCORING_LABEL[String(params['scoring']    || 'total_wins')]  || 'Total wins';
  const dist       = DIST_LABEL[String(params['distribution'] || 'top_n')]         || 'Top-N';
  const reentry    = REENTRY_LABEL[String(params['reentry']   || 'single')]         || 'single entry';
  const duration   = String(params['duration'] || 'weekly');
  const tournType  = String(type);

  return `You are a senior CRM marketing expert for an online casino. Generate 3 compelling variants (A, B, C) for each communication channel to promote this tournament.

Tournament details:
- Type: ${tournType} tournament
- Prize pool: ${cur} ${prizePool.toLocaleString()}
- Duration: ${duration}
- Entry: ${entry}, ${reentry}
- Scoring: ${scoring}
- Prize distribution: ${dist}
- Region: ${String(params['geo'] || 'de').toUpperCase()} / License: ${lic}
- Language: ${lang}
- Tone: ${tone}

Generate exciting, competition-driven copy that emphasises the prize pool, ranking mechanism, and urgency.
Return ONLY valid JSON, no markdown, no extra text:
{
  "push": ["<70-100 chars, 1-2 emojis, tournament urgency>", "variant B", "variant C"],
  "email": [
    {"subject": "<45-60 chars, tournament-focused>", "body": "<60-90 words, include prize pool, entry details, how to win>"},
    {"subject": "...", "body": "..."},
    {"subject": "...", "body": "..."}
  ],
  "sms": ["<MAX 160 chars, prize pool + how to enter, end: STOP>", "variant B", "variant C"],
  "telegram": ["<*bold* _italic_, 120-200 chars, leaderboard excitement>", "variant B", "variant C"],
  "popup": [
    {"headline": "<max 45 chars, tournament name or prize>", "subtext": "<max 75 chars, entry + top prize>", "cta": "<max 22 chars>"},
    {"headline": "...", "subtext": "...", "cta": "..."},
    {"headline": "...", "subtext": "...", "cta": "..."}
  ]
}
All texts in ${lang}. Include prize pool amount (${cur} ${prizePool.toLocaleString()}) in at least 2 channels.`;
}
