// NL → campaign-params interpreter prompt (Phase 1 of the AI Assistant chat).
// The model ONLY translates the operator's free text into the structured knobs the
// deterministic campaign engine already exposes (CampaignGenerateSchema params). It
// NEVER produces campaign economics (cost / ROI / payout / bonusSize) — those come
// from buildConfig via /api/campaign/generate after the params are applied. See
// tasks/ai-assistant-chat-spec.md §2.

export interface InterpretPromptInput {
  prompt:      string;
  geoKeys:     string[];   // valid ISO-2 geo codes (GEO_CFG keys)
  scenarioIds: string[];   // valid scenario ids (SCENARIO_MSG keys)
  uiLang?:     string;
}

export function buildInterpretPrompt(data: InterpretPromptInput): string {
  const isRu = (data.uiLang ?? 'en') === 'ru';
  const geo  = data.geoKeys.join(', ');
  const scen = data.scenarioIds.join(', ');
  const noteLang = isRu ? 'Russian' : 'English';

  const contract = `
Return ONLY valid JSON (no markdown fence) with this exact shape:
{
  "intent": "prescriptive" | "goal" | "problem",
  "scenario": { "id": "<one of the scenario ids>", "lbl": "<short label>", "cat": "acquisition|retention|reactivation" } | null,
  "params": {
    "geo": "<ISO-2 or omit>",
    "segment": "new" | "mid" | "vip",
    "vertical": "casino" | "sports" | "both",
    "games": "slots" | "table" | "live",
    "bonusTypes": ["welcome"|"ndb"|"reload"|"cashback"|"dep2"|"dep3"|"fs"],
    "lic": "auto",
    "agg": "low" | "mid" | "high",
    "risk": "low" | "mid" | "high",
    "players": <integer 100..200000>,
    "budget": "<string or number>",
    "lang": "<2-letter>",
    "tone": "friendly" | "pro" | "aggressive"
  },
  "inferred": ["<param keys you filled with a sensible DEFAULT, not stated by the operator>"],
  "missing":  ["<critical param keys you could NOT determine>"],
  "notes":    ["<short ${noteLang} notes: regulatory flags, substitutions you made>"],
  "confidence": <0..1>
}`.trim();

  const rules = `
RULES:
- intent: "prescriptive" when the operator gives concrete parameters; "goal" when they give a desired outcome ("cheap reactivation", "aggressive acquisition", a target ROI/budget); "problem" when they describe a symptom ("churn is up").
- Valid geo codes: ${geo}. If the operator names a country not in this list, OMIT geo and add "geo" to missing.
- Valid scenario ids: ${scen}. Map the request to the closest id. If none fits, use "custom".
- Only emit enum values exactly as listed above. For anything you are unsure of, OMIT it and (if critical) add its key to missing.
- lic: always "auto" unless the operator explicitly names a license.
- "cheap" / "подешевле" → agg: "low". "aggressive" / "максимум" → agg: "high".
- DEFAULTS vs STATED: every param you set that the operator did NOT state goes in "inferred". Do NOT guess geo, segment or players silently — if you cannot determine them, add them to "missing".
- CRITICAL fields: geo (always); segment OR a scenario that implies one; players (add to missing only for intent "goal", where scale matters).
- bonusTypes: include ONLY the specific mechanic(s) the operator explicitly names (welcome, ndb/no-deposit, reload, cashback, dep2/dep3, fs/free-spins). If they describe a scenario or OUTCOME WITHOUT naming mechanics (e.g. "first launch", "launch a new casino", "reactivation", "VIP retention"), **OMIT bonusTypes entirely** — the app then fills the scenario's full default package, so the WHOLE campaign is generated (several mechanics), not a single bonus.
- NEVER output cost, ROI, payout, bonusSize, wager or any economic number — you only pick parameters; the engine computes economics.
- REGULATORY: Brazil (geo "br") PROHIBITS welcome bonuses (Law 14.790/2023) — the app strips welcome from a BR package automatically, so you do not need to; just never ADD a welcome you weren't asked for in BR.`.trim();

  const examples = `
EXAMPLES:
Operator: "100% welcome up to 200 EUR, 35x, Germany, mid players"  // names a specific mechanic → keep it
→ {"intent":"prescriptive","scenario":{"id":"first_dep","lbl":"Welcome","cat":"acquisition"},"params":{"geo":"de","segment":"mid","bonusTypes":["welcome"],"lic":"auto","agg":"mid"},"inferred":["risk"],"missing":[],"notes":[],"confidence":0.9}

Operator: "set up a first-launch campaign for a new casino in Germany"  // no mechanic named → OMIT bonusTypes, the app fills the full launch package
→ {"intent":"goal","scenario":{"id":"first_launch","lbl":"Casino launch","cat":"acquisition"},"params":{"geo":"de","segment":"new","lic":"auto","agg":"mid"},"inferred":["segment","agg"],"missing":["players"],"notes":[],"confidence":0.8}

Operator: "bring back players in Brazil who haven't deposited in 30 days, keep it cheap"  // no mechanic named → OMIT bonusTypes
→ {"intent":"goal","scenario":{"id":"churn_risk","lbl":"Reactivation","cat":"reactivation"},"params":{"geo":"br","segment":"mid","lic":"auto","agg":"low"},"inferred":["segment","risk"],"missing":["players"],"notes":[],"confidence":0.75}`.trim();

  const intro = isRu
    ? 'Ты парсер намерений оператора iGaming. Переводишь свободный текст в параметры бонусной кампании. Ты НЕ считаешь экономику — только выбираешь параметры.'
    : 'You are an iGaming operator-intent parser. You translate free text into bonus-campaign parameters. You do NOT compute economics — you only pick parameters.';

  return `${intro}

${contract}

${rules}

${examples}

OPERATOR REQUEST:
"""
${data.prompt}
"""

Reply with the JSON only.`;
}
