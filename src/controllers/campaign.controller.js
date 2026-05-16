import { GEO_CFG, TONE_DESC, LANG_NAME, SEG_DESC } from '../domain/campaign/scenarios.js';
import { bonusLine, parseAI }                       from '../domain/ai/parser.js';
import { generateText }                             from '../services/ai.service.js';
import * as campaignService                         from '../services/campaign.service.js';

export function generate(req, res) {
  const { scenario, params } = req.body || {};
  if (!params || typeof params !== 'object') {
    return res.status(400).json({ error: 'params required' });
  }
  try {
    res.json(campaignService.generateCampaign({ scenario, params }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Campaign generation failed' });
  }
}

export async function texts(req, res) {
  const { scenario, mechanic, mechanicType, params } = req.body || {};
  if (!params) return res.status(400).json({ error: 'params required' });

  const geo   = GEO_CFG[params.geo] || GEO_CFG['de'];
  const lang  = LANG_NAME[params.lang] || 'English';
  const tone  = TONE_DESC[params.tone] || TONE_DESC.friendly;
  const seg   = SEG_DESC[params.segment] || SEG_DESC.mid;
  const bonus = bonusLine(mechanic, mechanicType);
  const lic   = (geo.lic || 'none').toUpperCase();

  // TODO(phase-6): extract to src/ai/prompts/texts.prompt.js
  const prompt = `You are a senior CRM marketing expert for an online casino. Generate 3 compelling variants (A, B, C) for each communication channel.

Campaign context:
- Scenario: ${scenario?.lbl || 'Player reactivation'}
- Bonus: ${bonus}
- Region: ${params.geo?.toUpperCase()} / License: ${lic}
- Audience: ${seg}
- Language: ${lang}
- Tone: ${tone}

Return ONLY valid JSON, no markdown, no extra text:
{
  "push": ["<70-100 chars, 1-2 emojis>", "variant B", "variant C"],
  "email": [
    {"subject": "<45-60 chars>", "body": "<60-90 words, include 1 T&C sentence>"},
    {"subject": "...", "body": "..."},
    {"subject": "...", "body": "..."}
  ],
  "sms": ["<MAX 160 chars, end: STOP>", "variant B", "variant C"],
  "telegram": ["<*bold* _italic_, 120-200 chars>", "variant B", "variant C"],
  "popup": [
    {"headline": "<max 45 chars>", "subtext": "<max 75 chars>", "cta": "<max 22 chars, button text>"},
    {"headline": "...", "subtext": "...", "cta": "..."},
    {"headline": "...", "subtext": "...", "cta": "..."}
  ]
}
All texts in ${lang}. Include bonus code and key conditions in every variant.`;

  try {
    const text = await generateText(prompt, { maxTokens: 4096 });
    res.json(parseAI(text));
  } catch (err) {
    console.error('Texts AI error:', err.message);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
}

export async function audit(req, res) {
  const { scenario, mechanic, mechanicType, params, uiLang } = req.body || {};
  if (!params) return res.status(400).json({ error: 'params required' });

  const geo   = GEO_CFG[params.geo] || GEO_CFG['de'];
  const lic   = (geo.lic || 'none').toUpperCase();
  const bonus = bonusLine(mechanic, mechanicType);
  const lang  = LANG_NAME[uiLang] || LANG_NAME[params.lang] || 'English';

  // TODO(phase-6): extract to src/ai/prompts/audit.prompt.js
  const prompt = `You are a gambling compliance officer. Audit this CRM bonus campaign for risks and compliance issues.

Campaign: ${scenario?.lbl || 'Reactivation'}
Bonus: ${bonus}
Region: ${params.geo?.toUpperCase()}, License: ${lic}
Segment: ${SEG_DESC[params.segment]||'regular players'}, Risk: ${params.risk||'low'}

IMPORTANT: Write ALL text fields (label, note, text, impact) in ${lang}.

Audit 5 aspects. Return ONLY valid JSON, no markdown:
{
  "checks": [
    {"label": "<aspect name in ${lang}>", "status": "ok",      "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"},
    {"label": "<aspect name in ${lang}>", "status": "ok|warn", "note": "<under 90 chars in ${lang}>"}
  ],
  "recommendations": [
    {"text": "<specific actionable fix in ${lang}, under 95 chars>", "impact": "<expected benefit in ${lang}, under 55 chars>"}
  ]
}
Give 2-4 recommendations. Be specific to the actual bonus parameters and region.`;

  try {
    const text = await generateText(prompt, { maxTokens: 900 });
    res.json(parseAI(text));
  } catch (err) {
    console.error('Audit AI error:', err.message);
    res.status(500).json({ error: err.message || 'Audit failed' });
  }
}
