interface WheelOptimizeParams {
  params: Record<string, unknown>;
  econ: {
    evPerSpin:             number;
    participantsMid:       number;
    spinsPerParticipant:   number;
    programCostMid:        number;
    ggrUpliftMid:          number;
    retentionValue:        number;
    totalValueMid:         number;
    netResultMid:          number;
    roi:                   number;
    costRatio:             number;
    costPerActiveMid:      number;
    maxRisk:               number;
    breakEvenParticipants: number;
  };
  region:  string;
  cur:     string;
  uiLang?: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export function buildWheelOptimizePrompt(data: WheelOptimizeParams): string {
  const isRu = (data.uiLang ?? 'en') === 'ru';
  const { econ: e, params: p, cur } = data;
  const seg    = String(p['segment']   ?? 'depositors');
  const freq   = String(p['frequency'] ?? 'daily');
  const preset = String(p['preset']    ?? 'welcome');

  const modelFormulas = isRu
    ? `Экономическая модель колеса:
- evPerSpin = Σ (вес_i/Σвес) × стоимость_приза_i  (bonus/multiplier через модель payout, free spins = spins×bet×RTP, cashback = доля×депозит)
- programCost = participants × spinsPerMonth × evPerSpin
- totalValue = ggrUplift (gamification-прирост GGR) + retentionValue
- roi = totalValue / programCost × 100; netResult = totalValue − programCost
Рычаги: frequency (cadence → участие/spins/uplift), веса сегментов (снизить долю дорогих призов → ниже EV), prizeValue дорогих сегментов, segment аудитории, RTP/wager (стоимость bonus-призов).`
    : `Wheel economics model:
- evPerSpin = Σ (weight_i/Σweight) × prize_cost_i  (bonus/multiplier via payout model, free spins = spins×bet×RTP, cashback = fraction×deposit)
- programCost = participants × spinsPerMonth × evPerSpin
- totalValue = ggrUplift (gamification GGR lift) + retentionValue
- roi = totalValue / programCost × 100; netResult = totalValue − programCost
Levers: frequency (cadence → participation/spins/uplift), segment weights (shift weight off expensive prizes → lower EV), prizeValue of rich segments, audience segment, RTP/wager (bonus-prize cost).`;

  const econSummary = isRu
    ? `Текущая экономика (${preset}, ${freq}, ${seg}):
- EV на спин: ${cur} ${e.evPerSpin}
- Участники (ожид.): ${fmt(e.participantsMid)}, спинов/мес: ${e.spinsPerParticipant}
- Стоимость программы: ${cur} ${fmt(e.programCostMid)}
- GGR uplift: +${cur} ${fmt(e.ggrUpliftMid)}; Retention: +${cur} ${fmt(e.retentionValue)}
- Net result: ${e.netResultMid >= 0 ? '+' : ''}${cur} ${fmt(e.netResultMid)}; ROI: ${e.roi}%
- Cost ratio: ${e.costRatio}% от GGR; Cost/active: ${cur} ${fmt(e.costPerActiveMid)}
- Max risk: ${cur} ${fmt(e.maxRisk)}; Break-even: ${e.breakEvenParticipants} участников`
    : `Current economics (${preset}, ${freq}, ${seg}):
- EV per spin: ${cur} ${e.evPerSpin}
- Participants (expected): ${fmt(e.participantsMid)}, spins/mo: ${e.spinsPerParticipant}
- Program cost: ${cur} ${fmt(e.programCostMid)}
- GGR uplift: +${cur} ${fmt(e.ggrUpliftMid)}; Retention: +${cur} ${fmt(e.retentionValue)}
- Net result: ${e.netResultMid >= 0 ? '+' : ''}${cur} ${fmt(e.netResultMid)}; ROI: ${e.roi}%
- Cost ratio: ${e.costRatio}% of GGR; Cost/active: ${cur} ${fmt(e.costPerActiveMid)}
- Max risk: ${cur} ${fmt(e.maxRisk)}; Break-even: ${e.breakEvenParticipants} participants`;

  const task = isRu
    ? e.netResultMid < 0
      ? 'Колесо прогнозирует отрицательный результат. Дай рекомендации, как выйти в плюс.'
      : 'Колесо прибыльно. Дай рекомендации, как усилить ROI/удержание без раздувания стоимости.'
    : e.netResultMid < 0
      ? 'The wheel forecasts a negative result. Recommend changes to reach a positive net result.'
      : 'The wheel is profitable. Recommend changes to strengthen ROI/retention without inflating cost.';

  const schema = isRu
    ? `Ответь ТОЛЬКО валидным JSON без markdown:
{
  "recommendations": [
    {"param": "frequency|weights|prizeValue|segment|rtp|wager", "current": "<текущее>", "target": "<целевое>", "reason": "<до 120 символов>", "impact": "high|med|low"}
  ]
}`
    : `Reply ONLY with valid JSON, no markdown:
{
  "recommendations": [
    {"param": "frequency|weights|prizeValue|segment|rtp|wager", "current": "<current>", "target": "<target>", "reason": "<up to 120 chars>", "impact": "high|med|low"}
  ]
}`;

  return isRu
    ? `Ты аналитик по экономике казино-механик. Оцени колесо фортуны и дай рекомендации.

МОДЕЛЬ:
${modelFormulas}

ЭКОНОМИКА:
${econSummary}

ЗАДАЧА: ${task}
Дай 1–4 конкретные рекомендации.

${schema}`
    : `You are a casino mechanic economics analyst. Assess this wheel of fortune and give recommendations.

MODEL:
${modelFormulas}

ECONOMICS:
${econSummary}

TASK: ${task}
Give 1–4 concrete recommendations.

${schema}`;
}
