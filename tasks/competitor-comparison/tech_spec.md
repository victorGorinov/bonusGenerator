# Tech Spec: Сравнение бонусов конкурентов (Competitor Comparison)

## Обзор

Новая SPA-страница `public/competitor-comparison.html` + `competitor-comparison.js`, новый backend use-case для AI-поиска и сравнения конкурентных бонусов, новая сущность персистентности `competitor-comparisons` в существующем `saved_items` паттерне.

## Изменения данных

Персистентность — через существующий униформный паттерн `saved_items` (`002_saved_items.sql` + `src/use-cases/SavedItems.ts`): добавить `competitor-comparisons` в whitelist `ENTITIES`, по той же схеме `{id, workspace_id, client_id, data JSONB, created_at, updated_at}` + `UNIQUE(workspace_id, client_id)`, что и у остальных шести сущностей. Требуется миграция (новая таблица `competitor_comparisons`, либо расширение generic-механизма, если он есть — сверить реализацию `002_saved_items.sql` перед стартом).

Структура `data` (JSONB):

```
{
  region: Region,
  promoType: 'bonus' | 'tournament' | 'loyalty',
  ownOffer: { source: 'saved' | 'draft', savedId?: string, snapshot: <config subset> },
  competitors: [{
    name: string,
    source: 'ai_search' | 'manual',
    foundAt?: string,        // ISO date, только для ai_search
    sourceUrl?: string,
    confidence?: 'confirmed' | 'unconfirmed',
    params: { ... }          // нормализованные параметры под promoType
  }],
  result: {
    verdict: string,
    strengths: string[],
    weaknesses: string[],
    recommendations: [{ param, current, competitorBenchmark, suggested, reason }]
  },
  createdAt: string
}
```

Данные конкурентов не хранятся отдельной переиспользуемой базой — только внутри снапшота конкретного сравнения. Live-поиск не кешируется между сравнениями разных пользователей (см. Юридический риск в PRD).

## API / Интерфейсы

Новые роуты (Express, паттерн use-case → controller → route):

| Method | Path | Limiter | Schema | Назначение |
|---|---|---|---|---|
| POST | `/api/competitor/search` | aiLimiter 15/min | `CompetitorSearchSchema { casinoName, region, promoType, uiLang }` | Живой AI-поиск публичных условий бонуса конкурента |
| POST | `/api/competitor/compare` | aiLimiter 15/min | `CompetitorCompareSchema { region, promoType, ownOffer, competitors[] }` | Генерация таблицы сопоставления + вердикта + рекомендаций |
| GET/POST | `/api/saved/competitor-comparisons` | apiLimiter + requireAuth + requireWorkspace | существующая `SaveItemSchema` | Список / сохранение сравнения — переиспользует generic saved-items роут |
| DELETE | `/api/saved/competitor-comparisons/:id` | ↑ | — | Удаление сохранённого сравнения |

Оба AI-роута — за `optionalAuth` + `requireFeature('competitorComparison')` (новый ключ в `FEATURES`, `src/config/features.ts`, по аналогии с `games`/`loyalty`). Открыт ли он гостю по умолчанию, как `games`, или закрыт как `loyalty` — решение до старта разработки, `[уточнить с командой]`; учитывая стоимость живого веб-поиска на вызов, вероятно ближе к закрытому.

Новые файлы по существующим паттернам проекта:
- `src/validation/competitor.schema.ts` — `CompetitorSearchSchema`, `CompetitorCompareSchema` + `z.infer` типы
- `src/ai/prompts/competitor-search.prompt.ts`, `competitor-compare.prompt.ts`
- `src/ai/parser.ts` — добавить `CompetitorSearchResponseSchema`, `CompetitorCompareResponseSchema` (Zod)
- `src/use-cases/GenerateCompetitorComparison.ts` — `searchCompetitorBonus()`, `compareCompetitorOffers()`
- `src/controllers/competitor.controller.ts` — `createCompetitorController({ ai })`
- `src/routes/competitor.routes.ts`

Фронтенд: `public/competitor-comparison.html` + `.js` — SPA-страница по образцу `loyalty-generator.html` (свой i18n-словарь + `t()`, views: `list` / `setup` / `result`, flash-prevention `.main{opacity:0}` + `.main.ready`, подключает `nav-utils.js` и `repo-http.js` для персистентности сравнений). Добавить пункт навигации в `_NAV_I18N` и ссылку на общем хабе (`generator.html` / `index.html`).

## Логика и алгоритмы

**Живой веб-поиск — ключевое архитектурное отличие от остальной AI-подсистемы.** Сегодня `src/ai/providers/anthropic.ts` — обёртка над Anthropic Messages API без tool use и без доступа в интернет (только генерация текста/JSON по промпту, как в остальных прод-сценариях проекта). Варианты реализации (решение блокирует старт разработки, `[уточнить с командой]`):

1. **Anthropic web search tool** внутри `AnthropicProvider` — новый режим вызова с включённым server-side веб-поиском, обработка ответа с `tool_use`/citation-блоками. Меньше интеграционных швов (один провайдер), но нужно проверить актуальную доступность/лимиты инструмента.
2. **Внешний поисковый API** (например, Bing/Serper/Tavily) как отдельный сервис — результаты передаются в промпт как контекст, финальная суммаризация обычным Haiku-вызовом без tool use. Больше контроля над источниками (можно ограничить типы/домены сайтов), но новый внешний сервис, ключ, лимиты, доп. отказоустойчивость.

**`searchCompetitorBonus({ casinoName, region, promoType })`** — промпт с указанием региона/типа промо и явной инструкцией не выдумывать данные; при отсутствии релевантного публичного источника — возвращает `confidence: 'unconfirmed'`, `sourceUrl: null`, а не приблизительные цифры. Парсинг через `CompetitorSearchResponseSchema` с тем же `tryRepairJSON`-фоллбэком, что и у остальных AI-ответов проекта.

**`compareCompetitorOffers({ ownOffer, competitors, promoType })`** — сначала детерминированная нормализация параметров по `promoType` (переиспользует уже посчитанные поля из `buildConfig` / tournament econ / loyalty econ, не пересчитывает заново), затем один AI-вызов на текстовый вердикт и рекомендации. В промпт передаётся уже нормализованная таблица, а не сырые тексты конкурентов — снижает риск, что модель начнёт домысливать по неструктурированному вводу.

**Нормализация параметров по типу промо** (строки таблицы сравнения):
- Bonus: match % (welcome), вейджер (×), макс. выигрыш, мин. депозит, длительность
- Tournament: размер призового фонда, модель распределения, охват сегмента, длительность
- Loyalty: топ-cashback %, earn rate, redeem rate, количество тиров

## Зависимости

- Anthropic AI-провайдер — новая зависимость от способа веб-поиска (см. выше); при выборе стороннего API — новая переменная окружения (например, `SEARCH_API_KEY`) в `EnvSchema`
- Существующий `saved_items` слой персистентности — новая entity, без новой инфраструктуры БД
- `requireFeature`/`FEATURE_PRESETS` слой доступа — новый feature-ключ
- Существующие geo-конфиги (`src/config/geo/`) — ограничивают список регионов в форме
- `nav-utils.js`, `repo-http.js`, i18n-паттерн существующих генераторов — переиспользуются

## Edge cases и обработка ошибок

- ИИ не находит публичный источник по конкуренту → `confidence: 'unconfirmed'`, значение не участвует в вердикте как факт, UI показывает предупреждение (US-7)
- Конкурент на сайте с гео-блокировкой или не на понятном языке → тот же fallback, что и «не найдено»
- Пользователь без сохранённых предложений (гость или новый пользователь) → предлагается сравнение с текущим черновиком; при его отсутствии — пустое состояние с CTA в соответствующий генератор
- Более 3 конкурентов в запросе → отклоняется на уровне Zod-схемы (`.max(3)`)
- Rate limit / таймаут AI-провайдера при поиске → стандартная обработка ошибок проекта (`AIProviderError`, exponential backoff как в `anthropic.ts`)
- Гость пытается сохранить сравнение → 401/403 по аналогии с остальными `requireAuth`-эндпоинтами; фронтенд показывает оверлей в духе `feature-gate.js` вместо непрозрачной ошибки
- Устаревшие данные в сохранённом сравнении → кнопка «Обновить данные» (US-6) вместо фоновой автообновляемой джобы — фоновые задачи не нужны для v1

## Оценка сложности

**L.** Основной источник сложности не в CRUD/UI — это стандартный паттерн, уже трижды реализованный в проекте для Bonus/Tournament/Loyalty генераторов, — а в новой для проекта возможности живого веб-поиска через ИИ, которой сегодня в AI-подсистеме нет вообще. При выборе стороннего поискового API (вариант 2 в разделе «Логика и алгоритмы») оценка смещается ближе к **XL** из-за нового внешнего сервиса, ключей и лимитов. Остальной объём (схемы, use-case, controller, route, SPA-страница, saved_items entity, feature-флаг, i18n) сопоставим по размеру с Loyalty Generator.
