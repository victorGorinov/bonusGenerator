# Задача: AI-ревью прогнозных результатов турнира (`/api/tournament/optimize`)

## Контекст

В Campaign Generator есть AI-фича `optimize` (`POST /api/campaign/optimize`), которая по экономике
кампании выдаёт 2–3 рекомендации по изменению параметров. У турниров такого аналога нет —
есть только `texts`, `audit`, `recommendGames`.

Нужно добавить **AI-ревью прогнозных результатов турнира** (GGR lift, net margin, ROI, break-even),
зеркаля архитектуру кампанийного `optimize`, но оперируя турнирными рычагами.

Ревью решает **две задачи**:
1. **Оценка реалистичности прогноза** — насколько спрогнозированные показатели (participation rate,
   engagement multiplier, GGR lift, ROI, cost-per-active, retention) правдоподобны относительно
   **средних по отрасли для данного региона/сегмента**. Цель — поймать «слишком красивый» или
   «слишком пессимистичный» прогноз до запуска.
2. **Рекомендации по улучшению** — что изменить в параметрах, чтобы поднять результат (см. ниже).

## Режим работы

Кнопка доступна **всегда** (не только при отрицательном ROI). Промпт работает в двух режимах
через поле `mode`:
- `mode: 'optimize'` — когда `netMarginMid < 0` или `roi < 0`: «как исправить отрицательный результат».
- `mode: 'review'` — когда результат положительный: «как усилить результат / поднять ROI».

Фронт определяет `mode` по знаку `econ.netMarginMid` (или `econ.roi`) и шлёт его в запросе.

## Размещение (фронт)

Step 3 мастера турнира, в блоке экономики (`tournament-generator.js`, рендер econ-карточек,
рядом с ROI/break-even ~строки 499–595). Кнопка «AI-ревью результатов» → панель с рекомендациями
в стиле campaign optimize.

---

## Бэкенд

### 0. Отраслевые бенчмарки по региону — `src/domain/tournament/benchmarks.ts` (новый)

Детерминированный справочник «нормальных» диапазонов по региону (и, где нужно, по сегменту/длительности),
чтобы realism-оценка не зависела целиком от галлюцинаций модели, а опиралась на цифры из кода.
Переиспользовать уже существующие в `calcEconomics.ts` константы как источник истины:
`ARPU_BY_REGION`, `PARTICIPATION_RATES`, `ENGAGEMENT_LIFT`, `RETENTION_LIFT`.

Экспортировать функцию вида:
```ts
export function tournamentBenchmarks({ region, segment, duration }): {
  arpuUsd:        { lo: number; mid: number; hi: number };   // нормальный ARPU по региону
  participation:  { lo: number; mid: number; hi: number };   // % eligible (из PARTICIPATION_RATES)
  engagement:     number;                                     // типичный engMul для duration
  retentionLift:  number;                                     // типичный retLift для segment
  roi:            { lo: number; hi: number };                 // здравый диапазон ROI турнира
  costPerActive:  { lo: number; hi: number };                 // нормальный cost/active в USD
}
```
Диапазоны ROI / cost-per-active задать как разумные отраслевые ориентиры (например ROI турнира
обычно −20%…+150%; всё что выше — повод усомниться). Значения держать в одном месте, документировать
источник в комментариях.

### 1. Промпт — `src/ai/prompts/tournament-optimize.prompt.ts`

`buildTournamentOptimizePrompt(data)`, RU/EN ветки (по `uiLang`), как в `optimize.prompt.ts`.

Вход (interface `TournamentOptimizeInput`):
- `type: string`
- `params: { duration, segment, prizePool, poolModel, rake?, totalPlayers, ... }`
- `econ`: ключевые поля из `TournamentEconomics` — `arpu, eligible, durationDays,
  engagementMultiplier, participantsMid, ggrLiftMid, retentionValue, prizePoolCost,
  netMarginMid, totalValueMid, roi, breakEvenParticipants, costPerActiveMid`
- `mode: 'optimize' | 'review'`
- `benchmarks` — результат `tournamentBenchmarks({ region, segment, duration })` (см. шаг 0)
- `region: string`
- `uiLang?: string`

В промпт включить **таблицу сравнения «прогноз vs отрасль»**: по каждому показателю
(participation %, engagement ×, ARPU, ROI, cost/active, retention) — спрогнозированное значение
рядом с региональным бенчмарк-диапазоном. Модель должна по каждому вынести вердикт
`realistic | optimistic | pessimistic` с короткой причиной и, где уместно, указать насколько
прогноз выходит за норму. Прямо инструктировать: бенчмарки из `benchmarks` — это якорь, не выдумывать
свои числа, а опираться на переданные.

В промпте дать модели модель экономики (из `src/domain/tournament/calcEconomics.ts`):
- `ggrLiftMid = participantsMid × (arpu/30) × (engMul−1) × durationDays`
- `prizePoolCost` зависит от `poolModel` (fixed = prizePool; dynamic = prizePool×(1−rake/100); hybrid = prizePool×0.6)
- `netMargin = ggrLift − prizePoolCost`, `roi = totalValueMid / prizePoolCost`
- Рычаги влияния: `duration` (меняет engMul и participation rate), `segment` (меняет ratio и retention),
  `prizePool`/`poolModel`/`rake` (меняют cost), `totalPlayers` (меняет eligible).

Задача модели: вернуть ровно 2–3 рекомендации. Для `mode:'optimize'` — поднять net выше 0;
для `mode:'review'` — поднять ROI/totalValue. JSON без markdown-обёртки.

### 2. Парсер — `src/ai/parser.ts`

`TournamentOptimizeResponseSchema` (Zod) + `parseTournamentOptimizeResponse(raw)`:

```
{
  realism: {
    verdict: 'realistic' | 'optimistic' | 'pessimistic',  // общий вывод
    summary: string,                                       // 1–2 предложения
    checks: [{                                             // 3–6 показателей
      metric: string,            // 'participation' | 'engagement' | 'roi' | 'cost_per_active' | 'retention' | 'arpu'
      forecast: string,          // спрогнозированное значение
      benchmark: string,         // региональный диапазон/норма
      verdict: 'realistic' | 'optimistic' | 'pessimistic',
      note: string
    }]
  },
  recommendations: [{
    param: 'duration'|'segment'|'prizePool'|'poolModel'|'rake'|'totalPlayers',
    current: string,
    target: string,
    reason: string,
    impact: 'high'|'med'|'low'
  }]   // 1–3 элемента
}
```

Использовать существующий `tryRepairJSON` как в остальных парсерах.

### 3. Use-case — `src/use-cases/GenerateTournament.ts`

```ts
export async function optimizeTournament(input: TournamentOptimizeInput, ai: AIProvider) {
  const region = GEO_CFG[input.params.geo]?.region ?? input.region;
  const benchmarks = tournamentBenchmarks({
    region,
    segment:  input.params.segment,
    duration: input.params.duration,
  });
  const prompt = buildTournamentOptimizePrompt({ ...input, benchmarks, region });
  const raw = await ai.generate(prompt, { maxTokens: 1200 });   // +realism блок → bump budget
  return parseTournamentOptimizeResponse(raw);
}
```
Бенчмарки считаются на бэкенде (детерминированно), а не приходят с фронта — фронт их слать не должен.

### 4. Валидация — `src/validation/tournament.schema.ts`

`TournamentOptimizeSchema` + `TournamentOptimizeInput = z.infer<...>`. Поля: `type`, `params`,
`econ`, `mode` (enum optimize/review), `uiLang?`. По образцу `TournamentAuditSchema`.

### 5. Контроллер — `src/controllers/tournament.controller.ts`

Добавить метод `optimize` в `createTournamentController({ ai })`:
```ts
optimize: asyncHandler<{}, {}, TournamentOptimizeInput>(async (req, res) => {
  res.json(await optimizeTournament(req.body, ai));
}),
```

### 6. Маршрут — `src/routes/tournament.routes.ts`

```
POST /api/tournament/optimize  → aiLimiter (15/min) + validate(TournamentOptimizeSchema) + ctrl.optimize
```

---

## Фронтенд — `tournament-generator.html` + `tournament-generator.js`

1. В блоке экономики Step 3 добавить кнопку «AI-ревью результатов» (i18n).
2. Обработчик: собрать `{ type, params, econ: lastResult.econ, mode, uiLang }`,
   `mode = (econ.netMarginMid < 0 || econ.roi < 0) ? 'optimize' : 'review'`,
   `POST /api/tournament/optimize`.
3. Рендер панели из двух секций:
   - **Реалистичность прогноза** — общий бейдж вердикта (realistic = зелёный, optimistic = жёлтый,
     pessimistic = синий) + `summary` + список `checks` в виде «показатель: прогноз vs норма» с
     цветным бейджем по каждому. Это ключевая новая ценность инструмента.
   - **Рекомендации** — param / current → target / reason / impact-бейдж (стиль campaign optimize).
4. Состояния loading / error (читать `err?.message || String(err)`).
5. i18n-ключи (RU/EN/MN/ES): заголовок панели, текст кнопки, loading, ошибки,
   подписи review-vs-optimize, метки realism (вердикты, «прогноз», «норма по региону»,
   названия метрик participation/engagement/roi/cost_per_active/retention/arpu).

---

## Тесты и документация

- Тест use-case `optimizeTournament` с `MockAIProvider` (оба режима — optimize и review):
  inject через `createTournamentController({ ai: new MockAIProvider([...]) })`.
- Unit-тест `tournamentBenchmarks()` — корректные диапазоны по регионам/сегментам/длительностям
  и консистентность с константами `calcEconomics.ts`.
- Тест парсера на `realism` + `recommendations` (валидные/битые ответы, repair).
- Опционально: integration-тест маршрута `/api/tournament/optimize`.
- Обновить `CLAUDE.md`: таблица API routes, секция AI subsystem (новая schema + token budget 1000),
  data flow Tournament Generator, список prompts/parser, снять/обновить Task B в Pending work.

## Критерии приёмки

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — зелёные.
- При отрицательном прогнозе кнопка даёт рекомендации по выходу в плюс; при положительном — по усилению.
- Realism-секция показывает вердикт и сравнение ключевых метрик с региональными бенчмарками;
  «слишком оптимистичный» прогноз (например participation/ROI заметно выше нормы региона)
  помечается как optimistic с пояснением.
- Бенчмарки берутся из кода (детерминированно), модель использует их как якорь.
- AI-сбой деградирует мягко (ошибка в панели, не падение страницы).
- Соблюдены паттерны репозитория: asyncHandler, factory-injection, Zod-валидация, aiLimiter.

## Session rule

Перед началом кодинга — описать план и дождаться явного подтверждения пользователя
(см. CLAUDE.md → Session rules).
