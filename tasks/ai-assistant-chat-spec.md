# AI Assistant Chat — NL → Campaign (Spec + Phase 1 Plan)

**Status:** Phase 1 locked (decisions fixed 2026-11-23) · **Author:** product (Victor) + Claude · **Date:** 2026-11-23
**Related:** `CLAUDE.md` (AI subsystem, campaign data-flow), `tasks/param-explainability-plan.md`, `PRICING.md` (AI quota), `AUTH_IMPLEMENTATION_PLAN.md` (feature gating)

---

## 1. Problem / idea

Сегодня, чтобы собрать бонусную кампанию, оператор проходит визард (гео → сегмент → сценарий → шаги) или крутит слайдеры в Конфигураторе. Это требует знания параметров (вейджер, match %, механики, регуляторика).

**Идея:** оператор описывает **натуральным языком** либо желаемую кампанию («100% велком до €200, вейджер 35x, Германия, mid»), либо **желаемый результат** («реактивация dormant в Бразилии, бюджет €10k, ROI ≥ 180%»), а система предлагает **готовый конфиг** с параметрами, экономикой и текстами — который дальше редактируется в существующих инструментах.

**Эффект:** снижает порог входа (джуниор-CRM описывает намерение словами, система кодирует экспертные дефолты), ускоряет сборку, усиливает позиционирование Retention OS.

---

## 2. Главный принцип (не обсуждается)

> **AI переводит слова в параметры. Всю экономику и числа кампании считают детерминированные движки.**

Та же дисциплина, что уже применена в optimize-промпте и abuse-аудите: модель получает структурированный контекст и **никогда не выводит математику сама**. Чат — это тонкий слой intent-extraction поверх `buildConfig` / `recalcCosts` / `calcTournamentEconomics` / `payout.ts` / `abuseRisk` / `bonusBenchmarks`. Движки — это moat; чат — дверь.

Из этого следуют инварианты:
- AI не выдаёт `cost`, `ROI`, `payout`, `bonusSize` — он просит их у движка.
- Любое гео/механика/лицензия из текста валидируется против enum'ов схемы; невалидное → переспросить, а не «проглотить».
- Поля, которые оператор **не задал**, помечаются как `inferred` (дефолт), а не выдаются за его выбор (дисциплина `B.ov` / brand `apply`).

---

## 3. Scope

**In (Phase 1):**
- Один NL-запрос → распарсенные параметры → существующий `/api/campaign/generate`.
- Режим прескриптивный (параметры) + базовый целевой (цель переводится в сценарий/агрессивность, без солвера).
- Пред-заполнение Campaign Generator / Configurator; всё остаётся редактируемым.
- Регуляторные и abuse-гардрейлы в ответе (переиспользуют существующие слои).
- Слот-филлинг: если не хватает критичных полей — одно уточнение.

**Out (Phase 1, → Phase 2/3):**
- Многоходовой диалог с правками («сделай вейджер ниже»).
- Целевой режим через `balance-solver.js` (ROI/бюджет как target).
- Агент с tool-calling (generate→recalc→abuse→optimize в цикле).
- Tournament / Loyalty / Wheel как цель чата (Phase 1 — только Bonus/Campaign).
- Генерация текстов/описания оффера в том же вызове (остаются отдельными кнопками).

---

## 4. Режимы ввода

| Режим | Пример | Что извлекает AI |
|---|---|---|
| Прескриптивный | «100% велком до €200, 35x, Германия, mid» | параметры напрямую |
| Целевой (Phase 1: упрощённый) | «реактивация dormant в BR, подешевле» | сценарий + сегмент + агрессивность |
| Целевой (Phase 2: солвер) | «ROI ≥ 180% при бюджете €10k» | target + constraints → `solveToTarget` |
| Проблемный | «растёт отток mid в CIS» | проблема → сценарий `churn_risk` |
| Конкурентный (Phase 3) | «конкурент даёт 200%/40x, перебей» | → `competitor-analysis` |

---

## 5. Архитектура Phase 1 — Parser-слой

```
assistant.html (chat panel)
  → POST /api/assistant/interpret { prompt, uiLang, context? }
      → AI (Haiku) buildInterpretPrompt() → JSON
      → parseInterpretResponse() (Zod)  ← { intent, params, scenario, inferred[], missing[], notes[], confidence }
  ← если missing непусто → чат задаёт 1 уточнение (slot-fill), params сохраняются в draft
  ← если готово → фронт вызывает существующий POST /api/campaign/generate { scenario, params }
      → campaignService.generateCampaign() → buildConfig() + campaignExplanation()
  → пред-заполняет Campaign Generator / Configurator state; оператор правит и подтверждает
```

**Никаких новых движков.** `/api/assistant/interpret` только парсит; генерацию делает уже существующий `campaign.service.ts`.

### 5.1 Контракт парсера (target = `CampaignGenerateInput`)

Промпт заставляет модель вернуть **только** структуру, совместимую с `CampaignGenerateSchema` (`src/validation/campaign.schema.ts`), плюс мета-поля:

```jsonc
{
  "intent": "prescriptive | goal | problem",
  "scenario": { "id": "churn_risk", "lbl": "Reactivation", "cat": "retention" },
  "params": {
    "geo": "de",                 // ISO-2, валидируется против GEO_CFG ключей
    "segment": "mid",            // new | mid | vip
    "vertical": "casino",        // casino | sports | both
    "games": "slots",            // slots | table | live
    "bonusTypes": ["welcome"],   // ≤6, валидируется
    "lic": "auto",               // enum из схемы
    "agg": "mid",                // low | mid | high — «подешевле» → low
    "risk": "mid",
    "players": 5000,
    "budget": "10000",
    "lang": "de",
    "tone": "friendly"
  },
  "inferred": ["players", "risk", "tone"],   // поля-дефолты, не заданные оператором
  "missing":  [],                            // критичные поля, которых не хватает
  "notes":    ["BR: welcome prohibited — proposed reload/cashback"],
  "confidence": 0.82
}
```

Валидные значения (сверять, иначе → `missing`):
- **scenario.id ∈** `first_launch | churn_risk | return_win | return_loss | first_dep | second_dep | big_dep | vip_retention | vip_reactivation | sport_event | tournament | cashback | custom` (из `SCENARIO_MSG`, `src/domain/campaign/scenarios.ts`).
- **geo ∈** ключи `GEO_CFG` (de/dk/fr/es/it/nl/uk/ru/kz/us/mn/br/mx/co/ar/pe/cl/iq/ly/sy/ae).
- **segment / vertical / games / agg / risk / tone / lic** — enum'ы из `CampaignGenerateSchema.ParamsShape`.

### 5.2 Критичные поля (slot-filling)

Если после парсинга пусто одно из — чат задаёт **одно** уточнение, не выдумывает:
- `geo` (без него нет ни регуляторики, ни экономики);
- `segment` **или** `scenario` (одно выводимо из другого; если оба пусты — спросить цель);
- для целевого режима — `players` (нужно для масштаба бюджета/экономики).

Остальное (avgdep, rtp, plat) берётся из `GEO_CFG` дефолтов — помечается `inferred`.

---

## 6. Interaction flow + гардрейлы

1. Оператор печатает запрос.
2. `interpret` → params + notes + missing.
3. Если `missing` → одно уточнение (чип-кнопки предпочтительнее свободного ввода).
4. Иначе → `campaign/generate` → показать **карточку-превью**: механики, ключевые параметры, экономика (`econ`), **abuse-score** (прогон `assessBonusAbuse` на `data.selectedMechanics` + `econ`), регуляторные баннеры (`regulatoryNote`).
5. Оператор: **«Применить в Конфигуратор»** / **«Править»** / **«Другой вариант»**.
6. Применение → пред-заполняет существующий state (CS / draft), дальше обычный флоу (тексты, описание, Add to Calendar).

**Гардрейлы встроены в предложение, а не постфактум:**
- **Регуляторика** — BR welcome запрещён (Law 14.790) → модель в `notes` предлагает reload/cashback, механика **не** проставляется автоматически как welcome; UK/DK вейджер-кап 10× → `agg`/вейджер клампится бенчмарком.
- **Abuse** — любой предложенный конфиг прогоняется через детерминированный `src/domain/bonus/abuseRisk.ts`; score показывается в превью.
- **EV-санити** — если `econ` даёт EV-отрицательный конфиг, превью помечает это (красный), не «тихо».
- **Honest inference** — `inferred[]` рендерится отдельной строкой «я заполнил дефолтами: …».

---

## 7. Phase 1 — план реализации

### 7.1 Backend

| # | Файл | Что |
|---|---|---|
| 1 | `src/ai/prompts/assistant-interpret.prompt.ts` | `buildInterpretPrompt({ prompt, uiLang, geoKeys, scenarioIds })` — системный промпт: роль, строгий JSON-контракт (раздел 5.1), список валидных enum'ов, правило «не выдумывай числа кампании», регуляторные подсказки (BR/UK/DK). Few-shot 2–3 примера. Budget ~800 токенов. |
| 2 | `src/ai/parser.ts` | `parseInterpretResponse(raw)` — новая Zod-схема `InterpretResponseSchema` (intent/scenario/params/inferred/missing/notes/confidence), `tryRepairJSON`, бросает `AIProviderError` на невалид. Повторяет паттерн остальных `parse*Response`. |
| 3 | `src/use-cases/InterpretPrompt.ts` | `interpretPrompt(ai, input)` — вызывает `ai.generate(buildInterpretPrompt(...))`, парсит, **пост-валидирует** enum'ы (geo ∈ GEO_CFG, scenario ∈ SCENARIO_MSG; невалид → в `missing`), применяет регуляторный клампинг через `bonusBenchmarks`/`regulatoryNote`. Чистая, DI AIProvider. |
| 4 | `src/controllers/assistant.controller.ts` | `createAssistantController({ ai })` → `interpret` через `asyncHandler`. |
| 5 | `src/validation/assistant.schema.ts` | `AssistantInterpretSchema { prompt: z.string().min(1).max(2000), uiLang?, context? }`. |
| 6 | `src/routes/assistant.routes.ts` | `POST /api/assistant/interpret` — `aiLimiter` (15/min) + `optionalAuth` + `requireFeature('ai')`. Mount в `src/server/app.ts`. |

Генерацию **не дублируем** — фронт после `interpret` зовёт существующий `/api/campaign/generate`.

### 7.2 Frontend

| # | Файл | Что |
|---|---|---|
| 7 | `public/assistant.js` | Логика чат-панели: отправка prompt → `interpret` → если `missing` рендер уточнения (чипы) → иначе `campaign/generate` → превью-карточка (механики/econ/abuse/reg) → «Применить/Править/Вариант». Хранит `draft` (накапливает params между уточнениями). i18n EN/RU собственным словарём (как campaign-generator). |
| 8 | интеграция в `campaign-generator.html` (+ Bonus-таб хаба `generator.html`) | Боковая панель-чат (collapsible) + кнопка «AI-ассистент». Применение пишет в существующий `draft` через уже имеющиеся сеттеры (`startWizard`/`goStep`/prefill). `feature-gate.js` — оверлей для гостей (фича под `ai`). **Конфигуратор в Phase 1 не трогаем** — handoff туда в Phase 2. |
| 9 | превью-карточка | Переиспользует `risk-vector.js` (`RetomatBonusAbuse`) + `bonus-benchmarks.js` (`classifyValue`) для чипов — без новых вычислений. |

### 7.3 Тесты

| # | Файл | Что |
|---|---|---|
| 10 | `tests/ai/assistant.parse.test.js` | `parseInterpretResponse`: валидный JSON, repair, мусор → throw, mapping enum'ов. MockAIProvider. |
| 11 | `tests/domain/assistant.interpret.test.js` | `interpretPrompt`: невалидное гео → `missing`; BR welcome → `notes` + механика не-welcome; slot-fill (geo пусто → missing); `inferred` корректно помечен. |
| 12 | `tests/integration/api.assistant.test.js` | `POST /api/assistant/interpret` через реальный `app.ts`: 200 + shape; гость `ai:false` → 403 `FEATURE_FORBIDDEN`; validation 400 на пустой prompt. |

### 7.4 Порядок работ

1. Backend 1–6 (промпт → парсер → use-case → контроллер → схема → роут), тесты 10–11 по ходу.
2. Integration-тест 12, прогон `npm test` + `npm run typecheck` + `npm run lint`.
3. Frontend 7–9, ручная проверка в браузере (DE прескриптивный, BR целевой «подешевле», пустой geo → уточнение).
4. Правка `CLAUDE.md` (новый роут в таблице, data-flow, секция AI Assistant).

---

## 8. Feature gating & cost

- Фича под umbrella-флагом **`ai`** → гостям и `free` закрыта, выдаётся per-user из админки (как остальные AI-действия).
- `interpret` на Haiku 4.5 — ~$0.01/вызов (parsing, ~800 in / ~300 out). Дёшево; **одна причина не тянуть агента в Phase 1** — он множит вызовы, а AI-квоты ещё не метрятся (`PRICING.md` P0 #1).
- Учитывать вызов в будущем AI-метринге (один `interpret` = один AI-call в квоте Starter «100/мес»).

---

## 9. Риски и решения

| Риск | Решение |
|---|---|
| Галлюцинация гео/механики | Пост-валидация против enum'ов; невалид → `missing`, переспрос. |
| Модель «считает» экономику сама | Контракт запрещает числовые поля кампании; `econ` только из `campaign/generate`. |
| Молчаливая перезапись правок оператора | `inferred[]` показываем явно; применение не трогает уже отредактированные поля (`B.ov`-дисциплина). |
| Регуляторный промах (BR/UK/DK) | Клампинг через `bonusBenchmarks`/`regulatoryNote` в use-case, не в модели. |
| Стоимость при росте использования | Haiku + одно-shot; агент отложен до метринга квот. |

**Зафиксированные решения Phase 1 (2026-11-23):**
1. **Где живёт чат** → панель в **Campaign Generator** (parser output = `draft`, префилл почти бесплатный). Handoff «Открыть в Конфигураторе для тонкой настройки» (`params → CS`) — Phase 2. «Обе»/standalone отклонены как скоуп-крип.
2. **Уточнение при `missing`** → **структурные контролы** (чипы для enum'ов `segment/scenario/agg/vertical/games`, сгруппированный гео-селектор `cfgGeoOptions`, inline number для `players/budget/avgdep`) — детерминированно, без второго AI-вызова. Основной текстовый ввод **всегда доступен** как альтернатива.
3. **Целевой режим** → **упрощённый** (намерение → `scenario` + `agg`); числовой таргет (ROI/бюджет) оператора **не роняем молча** — показываем черновик + фактический ROI из `econ` и отсылаем в Balance-to-Profit. Солвер под числовой таргет — Phase 2, в паре с handoff в Конфигуратор.

---

## 10. Дальше (Phase 2–3, кратко)

- **Phase 2:** handoff «Открыть в Конфигураторе» (`params → CS`); целевой режим через `solveToTarget` (ROI/бюджет как target) — естественная пара, т.к. Balance-to-Profit живёт в Конфигураторе; многоходовые правки с сохранением draft; расширение на Tournament/Loyalty/Wheel.
- **Phase 3:** агент с tool-calling (generate→recalc→abuse→optimize в цикле), варианты «консервативный/агрессивный», конкурентный режим через `competitor-analysis`. Только после AI-квот (`PRICING.md` P0 #1).
