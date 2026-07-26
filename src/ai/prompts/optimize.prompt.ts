export interface OptimizeInput {
  geo: string;
  segment: string;
  lift: {
    wagFactor: number;
    wagerX: number;
    beW: number;
    genFactor: number;
    matchPct: number;
    mechFactor: number;
    hasNDB: boolean;
    hasReload: boolean;
    hasDep2: boolean;
    hasFS: boolean;
    hasCB: boolean;
    rtpFactor: number;
    rtp: number;
    platFactor: number;
    plat: string;
    base: number;
    lift: number;
  };
  economics: {
    net: number;
    campCost3: number;
    incrRev: number;
    incrPl: number;
    pl: number;
  };
  uiLang?: string;
}

const _fmtNum = new Intl.NumberFormat('en-US');
const fmtN = (n: number) => _fmtNum.format(Math.round(n));

export function buildOptimizePrompt(data: OptimizeInput): string {
  const isRu = (data.uiLang ?? 'en') === 'ru';
  const { lift: v, economics: eco } = data;

  // Precompute the wager↔breakeven relation so the model never has to compare the two
  // numbers itself (it has flipped "20× vs 21.2×" into "20× exceeds 21.2×").
  const belowBE = v.wagerX < v.beW;
  const f1Relation = belowBE
    ? `wager ${v.wagerX}× is BELOW breakeven ${v.beW}× (already low / player-friendly)`
    : v.wagerX > v.beW
      ? `wager ${v.wagerX}× is ABOVE breakeven ${v.beW}× (penalized)`
      : `wager ${v.wagerX}× EQUALS breakeven ${v.beW}×`;

  const factorTable = `
| Factor | Current value | Score |
|--------|--------------|-------|
| F1 Wager  | ${f1Relation} | ×${v.wagFactor.toFixed(3)} |
| F2 Generosity | match=${v.matchPct}% | ×${v.genFactor.toFixed(3)} |
| F3 Mechanics | NDB=${v.hasNDB}, Reload=${v.hasReload}, Dep2=${v.hasDep2}, FS=${v.hasFS}, CB=${v.hasCB} | ×${v.mechFactor.toFixed(3)} |
| F4 RTP | rtp=${(v.rtp * 100).toFixed(1)}% | ×${v.rtpFactor.toFixed(3)} |
| F5 Platform | ${v.plat} | ×${v.platFactor.toFixed(3)} |
Total lift: ${(v.lift * 100).toFixed(1)}% (base: ${(v.base * 100).toFixed(1)}%)
`.trim();

  const econSummary = `
Incremental players: ${fmtN(eco.incrPl)} (out of ${fmtN(eco.pl)})
Incremental revenue (3 mo): $${fmtN(eco.incrRev)} USD
Bonus payouts (3 mo): $${fmtN(eco.campCost3)} USD
Net result: $${fmtN(eco.net)} USD — NEGATIVE
`.trim();

  const factorFormulas = `
Factor formulas (for reference):
- F1 Wager: ratio = beW/wagerX; penalty = ratio<1 ? ratio^1.5 : clamp(ratio,1,2); F1 = clamp(0.7 + 0.3 × clamp(penalty, 0.3, 2.0), 0.65, 1.35). F1 INCREASES as wagerX DECREASES (lower wager → higher ratio → higher score, up to the 1.35 cap). Wager BELOW breakeven already scores ≥1 (favorable); wager ABOVE breakeven is penalized more steeply (^1.5). To raise F1, LOWER the wager. NEVER say the wager "exceeds"/"is above" breakeven unless wagerX > beW — use the relation stated in the factor table verbatim.
- F2 Generosity: effectiveValue = (matchPct/100) / max(wagerX/10, 1); F2 = clamp(0.85 + 0.30 × min(effectiveValue, 1.0), 0.85, 1.15). A high match% behind a high wager delivers little real value — score reflects effective value, not nominal generosity.
- F3 Mechanics: 1 + NDB×0.06 + Reload×0.08 + Dep2×0.04 + FS>20×0.04 + Cashback≥5%×0.07. Each mechanic adds retention.
- F4 RTP: Range 85%–99%. Higher RTP = slightly better retention, max ×1.06 at 99%.
- F5 Platform: mobile=×1.05, both=×1.0, desktop=×0.97.

To make net result positive: net = incrRev − campCost3 > 0
incrRev = pl × lift × ltv3
campCost3 = 3 × costRatio × pl × arpu (fixed — cannot be reduced by parameter changes)
Therefore: only increasing lift can improve net result.
`.trim();

  if (isRu) {
    return `Ты аналитик бонусных программ для онлайн-казино. Текущая кампания показывает отрицательный финансовый результат за 3 месяца.

МОДЕЛЬ INCREMENTAL REVENUE v2
Формула: lift = min(0.40, base × F1 × F2 × F3 × F4 × F5)

ТЕКУЩИЕ ЗНАЧЕНИЯ ФАКТОРОВ:
${factorTable}

ЭКОНОМИКА:
${econSummary}

ФОРМУЛЫ ФАКТОРОВ:
${factorFormulas}

ЗАДАЧА: Предложи ровно 2–3 конкретных изменения параметров бонусной кампании, которые увеличат lift и сделают net result положительным. Не более 3 рекомендаций. Для каждой рекомендации укажи:
- factor: "F1" / "F2" / "F3" / "F4" / "F5"
- param: название параметра (wager, matchPct, addNDB, addReload, addCashback, addDep2, addFS, rtp, plat)
- current: текущее значение (строка)
- target: целевое значение (строка)
- reason: объяснение на русском языке — почему это изменит lift и на сколько примерно вырастет
- impact: "high" / "med" / "low"

ВАЖНО: описывай текущее состояние каждого фактора ровно как в таблице выше — НЕ инвертируй сравнения (например, не пиши, что вейджер «превышает» breakeven, если он ниже него).

Отвечай ТОЛЬКО валидным JSON без markdown-обёртки:
{"recommendations":[{"factor":"F1","param":"wager","current":"50×","target":"25×","reason":"Снижение вейджера...","impact":"high"}]}`;
  }

  return `You are a bonus analytics expert for online casinos. The current campaign shows a negative net result over 3 months.

INCREMENTAL REVENUE MODEL v2
Formula: lift = min(0.40, base × F1 × F2 × F3 × F4 × F5)

CURRENT FACTOR VALUES:
${factorTable}

ECONOMICS:
${econSummary}

FACTOR FORMULAS:
${factorFormulas}

TASK: Suggest exactly 2–3 specific parameter changes (no more than 3) that will increase lift and make the net result positive. For each recommendation provide:
- factor: "F1" / "F2" / "F3" / "F4" / "F5"
- param: parameter name (wager, matchPct, addNDB, addReload, addCashback, addDep2, addFS, rtp, plat)
- current: current value (string)
- target: target value (string)
- reason: explanation — why this will change lift and by approximately how much
- impact: "high" / "med" / "low"

IMPORTANT: describe each factor's current state exactly as given in the table above — do NOT invert comparisons (e.g. never say the wager "exceeds" breakeven when it is below it).

Reply ONLY with valid JSON, no markdown wrapper:
{"recommendations":[{"factor":"F1","param":"wager","current":"50×","target":"25×","reason":"Reducing wager...","impact":"high"}]}`;
}
