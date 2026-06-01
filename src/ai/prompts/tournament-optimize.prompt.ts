import type { TournamentBenchmarks } from '../../domain/tournament/benchmarks.js';

export interface TournamentOptimizePromptInput {
  type:    string;
  params:  Record<string, unknown>;
  econ: {
    arpu:                  number;
    eligible:              number;
    durationDays:          number;
    engagementMultiplier:  number;
    participantsMid:       number;
    ggrLiftMid:            number;
    retentionValue:        number;
    prizePoolCost:         number;
    netMarginMid:          number;
    totalValueMid:         number;
    roi:                   number;
    breakEvenParticipants: number;
    costPerActiveMid:      number;
  };
  mode:       'optimize' | 'review';
  benchmarks: TournamentBenchmarks;
  region:     string;
  cur:        string;   // site currency code
  uiLang?:    string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export function buildTournamentOptimizePrompt(data: TournamentOptimizePromptInput): string {
  const isRu = (data.uiLang ?? 'en') === 'ru';
  const { econ: e, benchmarks: b, params: p, cur } = data;

  const dur     = String(p['duration'] ?? 'weekly');
  const seg     = String(p['segment']  ?? 'all');
  const pool    = String(p['poolModel'] ?? 'fixed');
  const rake    = Number(p['rake'] ?? 0);

  // Approximate USD cost-per-active using arpu ratio as FX proxy
  const arpuUsdMid = b.arpuUsd.mid;
  const fxApprox   = arpuUsdMid > 0 ? e.arpu / arpuUsdMid : 1;
  const cpaUsd     = fxApprox > 0 ? Math.round(e.costPerActiveMid / fxApprox * 100) / 100 : e.costPerActiveMid;

  const comparisonTable = isRu
    ? `| Показатель | Прогноз | Бенчмарк (${data.region}) | Задача |
|---|---|---|---|
| Participation | ${pct(e.participantsMid / Math.max(e.eligible, 1))} от eligible | ${pct(b.participation.lo)}–${pct(b.participation.hi)} | verdict + note |
| Engagement | ×${e.engagementMultiplier.toFixed(1)} | ×${b.engagement.toFixed(1)} типично | verdict + note |
| ARPU | ${cur} ${fmt(e.arpu)}/мес | $${b.arpuUsd.lo}–$${b.arpuUsd.hi} USD/мес | verdict + note |
| ROI | ${e.roi}% | ${b.roi.lo}%–${b.roi.hi}% | verdict + note |
| Cost/active | ~$${cpaUsd} USD | $${b.costPerActive.lo}–$${b.costPerActive.hi} USD | verdict + note |
| Retention | ${pct(b.retentionLift)} от участников | бенчмарк сегм. | verdict + note |`
    : `| Metric | Forecast | Benchmark (${data.region}) | Task |
|---|---|---|---|
| Participation | ${pct(e.participantsMid / Math.max(e.eligible, 1))} of eligible | ${pct(b.participation.lo)}–${pct(b.participation.hi)} | verdict + note |
| Engagement | ×${e.engagementMultiplier.toFixed(1)} | ×${b.engagement.toFixed(1)} typical | verdict + note |
| ARPU | ${cur} ${fmt(e.arpu)}/mo | $${b.arpuUsd.lo}–$${b.arpuUsd.hi} USD/mo | verdict + note |
| ROI | ${e.roi}% | ${b.roi.lo}%–${b.roi.hi}% | verdict + note |
| Cost/active | ~$${cpaUsd} USD | $${b.costPerActive.lo}–$${b.costPerActive.hi} USD | verdict + note |
| Retention | ${pct(b.retentionLift)} of participants | segment benchmark | verdict + note |`;

  const modelFormulas = isRu
    ? `Экономическая модель:
- ggrLiftMid = participantsMid × (arpu/30) × (engMul−1) × durationDays
- prizePoolCost: fixed=prizePool; dynamic=prizePool×(1−rake/100); hybrid=prizePool×0.6
- netMarginMid = ggrLiftMid − prizePoolCost
- roi = totalValueMid / prizePoolCost × 100  (totalValueMid = netMarginMid + retentionValue)
Рычаги влияния: duration (меняет engMul и participation%), segment (меняет ratio и retention), prizePool/poolModel/rake (стоимость), totalPlayers (eligible count).`
    : `Economic model:
- ggrLiftMid = participantsMid × (arpu/30) × (engMul−1) × durationDays
- prizePoolCost: fixed=prizePool; dynamic=prizePool×(1−rake/100); hybrid=prizePool×0.6
- netMarginMid = ggrLiftMid − prizePoolCost
- roi = totalValueMid / prizePoolCost × 100  (totalValueMid = netMarginMid + retentionValue)
Levers: duration (changes engMul and participation%), segment (changes eligible ratio and retention), prizePool/poolModel/rake (cost), totalPlayers (eligible count).`;

  const econSummary = isRu
    ? `Текущая экономика:
- Eligible: ${fmt(e.eligible)} игроков (${seg})
- Участники (ожид.): ${fmt(e.participantsMid)} чел.
- GGR lift: +${cur} ${fmt(e.ggrLiftMid)}
- Призовой фонд: ${cur} ${fmt(e.prizePoolCost)} (${pool}${rake ? `, rake ${rake}%` : ''})
- Net margin: ${e.netMarginMid >= 0 ? '+' : ''}${cur} ${fmt(e.netMarginMid)}
- Retention value: +${cur} ${fmt(e.retentionValue)}
- Total value: ${e.totalValueMid >= 0 ? '+' : ''}${cur} ${fmt(e.totalValueMid)}
- ROI: ${e.roi}%
- Break-even: ${e.breakEvenParticipants} участников`
    : `Current economics:
- Eligible: ${fmt(e.eligible)} players (${seg})
- Participants (expected): ${fmt(e.participantsMid)}
- GGR lift: +${cur} ${fmt(e.ggrLiftMid)}
- Prize pool cost: ${cur} ${fmt(e.prizePoolCost)} (${pool}${rake ? `, rake ${rake}%` : ''})
- Net margin: ${e.netMarginMid >= 0 ? '+' : ''}${cur} ${fmt(e.netMarginMid)}
- Retention value: +${cur} ${fmt(e.retentionValue)}
- Total value: ${e.totalValueMid >= 0 ? '+' : ''}${cur} ${fmt(e.totalValueMid)}
- ROI: ${e.roi}%
- Break-even: ${e.breakEvenParticipants} participants`;

  const modeDesc = isRu
    ? data.mode === 'optimize'
      ? 'Турнир прогнозирует отрицательный или нулевой результат. Дай рекомендации, как выйти в плюс.'
      : 'Турнир прогнозирует положительный результат. Дай рекомендации, как усилить ROI/total value.'
    : data.mode === 'optimize'
      ? 'The tournament forecasts a negative or breakeven result. Recommend changes to reach positive net margin.'
      : 'The tournament forecasts a positive result. Recommend changes to increase ROI / total value.';

  const schemaDesc = isRu
    ? `Ответь ТОЛЬКО валидным JSON без markdown:
{
  "realism": {
    "verdict": "realistic|optimistic|pessimistic",
    "summary": "<1-2 предложения — общий вывод>",
    "checks": [
      {
        "metric": "participation|engagement|roi|cost_per_active|retention|arpu",
        "forecast": "<спрогнозированное значение>",
        "benchmark": "<диапазон по региону>",
        "verdict": "realistic|optimistic|pessimistic",
        "note": "<причина, до 80 символов>"
      }
    ]
  },
  "recommendations": [
    {
      "param": "duration|segment|prizePool|poolModel|rake|totalPlayers",
      "current": "<текущее значение>",
      "target": "<целевое значение>",
      "reason": "<объяснение, до 120 символов>",
      "impact": "high|med|low"
    }
  ]
}`
    : `Reply ONLY with valid JSON, no markdown:
{
  "realism": {
    "verdict": "realistic|optimistic|pessimistic",
    "summary": "<1-2 sentences — overall conclusion>",
    "checks": [
      {
        "metric": "participation|engagement|roi|cost_per_active|retention|arpu",
        "forecast": "<forecasted value>",
        "benchmark": "<regional benchmark range>",
        "verdict": "realistic|optimistic|pessimistic",
        "note": "<reason, up to 80 chars>"
      }
    ]
  },
  "recommendations": [
    {
      "param": "duration|segment|prizePool|poolModel|rake|totalPlayers",
      "current": "<current value>",
      "target": "<target value>",
      "reason": "<explanation, up to 120 chars>",
      "impact": "high|med|low"
    }
  ]
}`;

  if (isRu) {
    return `Ты аналитик по экономике казино-турниров. Оцени реалистичность прогноза и дай рекомендации.

МОДЕЛЬ ЭКОНОМИКИ:
${modelFormulas}

ЭКОНОМИКА ТУРНИРА:
${econSummary}

СРАВНЕНИЕ ПРОГНОЗА С ОТРАСЛЕВЫМИ БЕНЧМАРКАМИ (регион: ${data.region}):
ВАЖНО: бенчмарки ниже — это якорь. Не придумывай собственные диапазоны — опирайся только на переданные.
${comparisonTable}

ЗАДАЧА: ${modeDesc}
1. Заполни секцию "realism": для каждого показателя вынеси вердикт (realistic/optimistic/pessimistic) с причиной. Если прогноз существенно выше бенчмарка — это "optimistic". Ниже — "pessimistic". В диапазоне — "realistic". Итоговый "verdict" = наиболее частый из checks. Дай 3–6 checks.
2. Дай ровно 1–3 рекомендации в секции "recommendations" для улучшения результата.

${schemaDesc}`;
  }

  return `You are a casino tournament economics analyst. Assess the realism of this forecast and provide improvement recommendations.

ECONOMIC MODEL:
${modelFormulas}

TOURNAMENT ECONOMICS:
${econSummary}

FORECAST vs INDUSTRY BENCHMARKS (region: ${data.region}):
IMPORTANT: the benchmarks below are the anchor. Do NOT invent your own ranges — use only the values provided.
${comparisonTable}

TASK: ${modeDesc}
1. Fill the "realism" section: for each metric, give a verdict (realistic/optimistic/pessimistic) with a reason. Forecast significantly above benchmark = "optimistic"; below = "pessimistic"; within range = "realistic". Overall "verdict" = most frequent from checks. Provide 3–6 checks.
2. Give exactly 1–3 recommendations in "recommendations" to improve the result.

${schemaDesc}`;
}
