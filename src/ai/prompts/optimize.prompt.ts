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

  const factorTable = `
| Factor | Current value | Score |
|--------|--------------|-------|
| F1 Wager  | wager=${v.wagerX}×, breakeven=${v.beW}× | ×${v.wagFactor.toFixed(3)} |
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
- F1 Wager: clamp(0.7 + 0.3 × clamp(beW/wagerX, 0.3, 2.0), 0.65, 1.35). Score>1 when breakeven_wager < wager (player-friendly). Reducing wager brings breakeven closer.
- F2 Generosity: clamp(0.85 + 0.30 × min(matchPct/100, 1.0), 0.85, 1.15). matchPct = bonus/deposit%. Score peaks at 1.15 when matchPct ≥ 100%.
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

Reply ONLY with valid JSON, no markdown wrapper:
{"recommendations":[{"factor":"F1","param":"wager","current":"50×","target":"25×","reason":"Reducing wager...","impact":"high"}]}`;
}
