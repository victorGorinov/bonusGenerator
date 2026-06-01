# Задача: Retention Calendar — модуль планирования ретеншн-кампаний

## 0. ВАЖНО: адаптация под реальный стек

Исходное ТЗ написано под React + Zustand + FullCalendar-from-CDN. **Этот репозиторий устроен иначе**,
и задачу нужно делать в его архитектуре, а не вводить React:

| Что в ТЗ | Что в репозитории (использовать это) |
|----------|--------------------------------------|
| React / JSX компоненты | Vanilla JS SPA: HTML-страница + внешний `.js` (как `tournament-generator.html` + `tournament-generator.js`) |
| Zustand / Redux | Обычные модули + localStorage за абстракцией репозитория |
| FullCalendar из CDN | FullCalendar через **npm**, бандлится Vite как новый entry-point (CDN нельзя — CSP `scriptSrc: 'self'`) |
| «backend if lacks…» | Backend есть (Express+TS+Zod). MVP-persistence — localStorage; см. §11 про future-ready абстракцию |

Сверяться с `CLAUDE.md`. Соблюдать session rule: **до кодинга описать план и дождаться явного
подтверждения пользователя.**

---

## Цель

Превратить продукт из «AI-генератора» в «рабочее пространство для планирования ретеншена CRM-команд
iGaming». Новый модуль **Retention Calendar** — визуальный планировщик кампаний, в который
**встроены текущие фичи** (Campaign Generator и Tournament Generator): сгенерированную кампанию/турнир
можно положить на календарь.

Scope: планирование, организация, идеация. **НЕ** исполнение CRM. Без интеграций, рассылок, пушей,
аналитики, ролей/прав, real-time-коллаборации (§14 ТЗ — Non-Goals соблюсти строго).

---

## Интеграция существующих фич (ключевое требование пользователя)

1. **«Add to calendar» из Campaign Generator** — на экране результата кампании
   (`campaign-generator.js`) добавить кнопку, которая собирает сгенерированный результат
   (mechanic/mechanicType, econ, тексты, geo, segment) в сущность `Campaign` и кладёт на календарь
   (status `draft`, даты по умолчанию — ближайшие выходные/неделя).
2. **«Add to calendar» из Tournament Generator** — аналогично в `tournament-generator.js`
   (type → `tournament`, даты из duration, rewards из prize pool).
3. **AI-Assisted Creation внутри календаря** — НЕ дублировать логику генерации. Вызывать существующие
   эндпоинты `POST /api/campaign/generate` (+ опц. `/api/campaign/texts`) и
   `POST /api/tournament/generate`. Маппинг ответа → `Campaign` вынести в `services/aiToCampaign.js`.

**Даты — независимы от генераторов.** Даты/длительность, заданные в генераторах (duration турнира,
suggested dates кампании), используются только как **дефолт-заготовка** при создании события. После
размещения на календаре `startDate`/`endDate` принадлежат сущности `Campaign` и редактируются свободно
(форма, drag&drop, resize) — они могут отличаться от исходных и НЕ синхронизируются обратно в генератор.
Маппер `ai-to-campaign.js` лишь проставляет начальные даты; дальше единственный источник истины — `Campaign`.

---

## Файловая структура (под vanilla-стек)

```
public/
  retention-calendar.html          # новая страница (sidebar как в TG/CG, purple)
  retention-calendar.js            # entry-point (регистрируется в vite.config.ts)
  retention-calendar/              # модули фичи (бандлятся как часть entry)
    types.js                       # JSDoc-типы Campaign / CampaignTemplate (см. §3)
    store.js                       # state + подписки (без внешних libs)
    repository.js                  # абстракция persistence (см. §11)
    ai-to-campaign.js              # маппинг ответов AI-эндпоинтов → Campaign
    calendar.js                    # инициализация FullCalendar (month/week/list)
    filters.js                     # мультиселект-фильтры
    templates.js                   # шаблоны
    conflicts.js                   # детектор пересечений
    export.js                      # CSV / JSON (+ опц. XLSX)
    i18n.js                        # ключи RU/EN/MN/ES
```
(Зеркалит подход «html + внешний js», как у остальных трёх инструментов.)

---

## 1. Зависимости и бандлинг

- `npm i @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction`
  (interaction = drag/drop + resize). Только эти — никаких тяжёлых лишних пакетов (§13 ТЗ).
- `vite.config.ts`: добавить entry `'retention-calendar': resolve(__dirname, 'public/retention-calendar.js')`.
- **CSP** (`src/server/app.ts`): FullCalendar инжектит inline-стили → проверить `styleSrc`; при необходимости
  добавить хэш/`'unsafe-inline'` для style (НЕ для script). `scriptSrc: 'self'` сохранить — бандл self-hosted.

---

## 2. Навигация

Добавить пункт **Retention Calendar** в сайдбары всех инструментов и в `index.html` (nav + tools hub).
Это **ещё один инструмент-агрегатор**, который объединяет остальные (Campaign Generator, Tournament
Generator, Configurator) — НЕ замена лендинга, лендинг остаётся точкой входа. Из календаря можно
запускать генерацию через существующие инструменты и собирать результаты в один план.
Маршрут: статика `public/retention-calendar.html`.

---

## 3. Сущности (JSDoc-типы в `types.js`)

Использовать модели из ТЗ §3 и §8 один-в-один (Campaign, CampaignTemplate). Поскольку фронт на JS —
оформить как JSDoc `@typedef` для подсказок и единого контракта. `type` маппить на существующие
сценарии/механики, где возможно (reload/cashback/freespins/tournament/vip/reactivation/sportsbook/custom).

**Single-brand (сейчас):** мультибрендовость пока не реализуем. Поле `brands: string[]` оставить в
модели (для совместимости с ТЗ и future-ready), но в MVP заполнять одним дефолтным брендом и **не
показывать** brand-фильтр/селектор в UI. Справочник брендов — отдельная будущая задача, когда система
станет мультибрендовой. Соответственно из §7 фильтр `brand` в MVP скрыть (остальные фильтры — type,
segment, geo, status — активны).

---

## 4. Создание кампаний

- **Manual** — модалка/боковая панель с полями из ТЗ §4A (title, type, segment, geo, dates, mechanics,
  rewards, notes, tags). Переиспользовать существующие стили форм/модалок (`styles.css`).
- **AI-Assisted** — поле промпта → парсинг намерения → вызов существующих AI-эндпоинтов → `ai-to-campaign.js`
  → предзаполненная форма → edit → save → на календарь.

---

## 5–7. Календарь, цвета, drag&drop, фильтры

- Views: **Month** (основной), **Week**, **Agenda/List**. FullCalendar `dayGridMonth` / `timeGridWeek` / `listMonth`.
- Карточка события: title, type, segment, dates.
- Цвета по type (ТЗ §5): VIP gold, Tournament blue, Cashback green, Reactivation purple, Sportsbook orange,
  Reload cyan. Брать токены из дизайн-системы (`styles.css`, `--gold` и т.п.), не хардкодить хексы вразнобой.
- Drag&drop + resize (`@fullcalendar/interaction`): `eventDrop` / `eventResize` → обновить
  `startDate`/`endDate` в store → `repository.save()` (персист автоматически). Это свободно меняет даты
  относительно дефолтов из генераторов (см. раздел «Интеграция», п.3) — обратной синхронизации нет.
- Фильтры (мультиселект, ТЗ §7): type, segment, geo, status. **Brand-фильтр в MVP скрыт** (single-brand,
  см. §3). Применяются к набору событий календаря.

---

## 7a. AI-рекомендации кампаний/турниров к праздникам и датам (region-aware)

Календарь должен подсказывать, **что и когда запускать**, привязываясь к праздникам и значимым датам
региона (geo бренда). Это ключевая «планировочная» ценность модуля.

**Источник дат — детерминированный справочник** `src/domain/calendar/holidays.ts` (новый):
календарь праздников/событий по региону (eu/cis/mn/sweep/crypto/latam — по `GEO_CFG`).
Включить: гос/региональные праздники, сезонные пики (НГ, 8 марта для CIS, Рождество для EU,
Цаган Сар для MN, карнавал для LATAM и т.п.), а также iGaming-релевантные события (крупные спортивные
турниры — для sportsbook). Каждая запись: `{ date, name, region, segmentsHint?, typeHint? }`. Справочник
держать данными, не AI, чтобы даты были точными.

**AI-слой** (переиспользовать AI-сервис, НЕ дублировать):
- Новый промпт `src/ai/prompts/calendar-suggest.prompt.ts` + парсер `parseCalendarSuggestResponse`
  (Zod) + use-case + контроллер + маршрут `POST /api/calendar/suggest` (aiLimiter 15/min, validate).
- Вход: `{ geo, region, horizonDays|month, segments?, existingCampaigns? (даты+типы для учёта занятости), uiLang? }`.
  На бэке к запросу приклеиваются праздники из `holidays.ts` за период (как якорь — модель не выдумывает даты).
- Выход: 3–6 рекомендаций `{ date|dateRange, holiday?, suggestedType, suggestedSegment, title, rationale, impact }`.
- Учитывать уже запланированное (existingCampaigns), чтобы не предлагать дубли в занятые слоты.

**UI:** панель «AI-идеи к датам» в Retention Calendar — список карточек-предложений на ближайший период;
кнопка «Add to calendar» на карточке создаёт `Campaign` (status `draft`) с предзаполненными type/segment/
датами/title (даты затем редактируемы — см. раздел «Интеграция», п.3). Каждое предложение можно сразу
догенерить через существующие генераторы (Campaign/Tournament) для механик и наград.

Future-ready: это основа для будущих «AI cadence recommendations» (§18) — не оверинжинирить сейчас.

## 8. Шаблоны и дублирование

- «Save as template» (Campaign → CampaignTemplate), «Create from template», «Duplicate campaign».
- Хранить отдельной коллекцией через тот же repository.

---

## 9. Conflict Detection (MVP Lite)

Детерминированно (без AI): кампании одного `type` + одного `segment` с пересекающимися датами →
бейдж «Potential overlap detected» на событиях. Модуль `conflicts.js`, чистая функция → набор пар id.

---

## 10. Экспорт

- **CSV** и **JSON** — обязательно, клиентский (Blob + download), без зависимостей.
- **XLSX** — **в MVP не делаем** (отложено, добавим при необходимости). Слой экспорта спроектировать
  расширяемым, чтобы XLSX/Google Sheets добавлялись без переработки (отдельные функции-форматтеры).
- Режимы: текущий отфильтрованный вид / полный план месяца / выбранные кампании.

---

## 11. Persistence — future-ready абстракция (важно)

НЕ хардкодить localStorage по всему коду. Ввести интерфейс репозитория:
```js
// repository.js — единственная точка доступа к данным
export const repo = {
  listCampaigns(), getCampaign(id), saveCampaign(c), deleteCampaign(id),
  listTemplates(), saveTemplate(t), deleteTemplate(id),
};
```
MVP-реализация — `LocalStorageRepository` (ключи `rc_campaigns`, `rc_templates`, JSON, как паттерн
`savedTournaments`). Контракт async-friendly (возвращать Promise), чтобы позже подменить на
Supabase/Postgres/multi-user без переписывания UI. Все `createdAt/updatedAt` проставлять в репозитории.

---

## 12. Адаптивность

Desktop + tablet — полный календарь. Mobile — упрощение до Agenda/List view (через media-query →
дефолтный view `listMonth`).

---

## 15. UX

Лёгкий планировщик в духе Notion Calendar / Linear roadmap: скорость, ясность, низкое трение.
Не enterprise-дашборд. Использовать существующий визуальный язык (purple sidebar, btn-gold и т.п.).

---

## Тесты и документация

- Unit (vitest, как `tests/domain/*`): `conflicts.js` (пересечения), `ai-to-campaign.js` (маппинг),
  `export.js` (корректный CSV/JSON), `repository.js` (CRUD на mock-storage),
  `holidays.ts` (корректные даты/регионы), `parseCalendarSuggestResponse` (валидные/битые ответы),
  use-case `/api/calendar/suggest` с `MockAIProvider`.
- Опц. e2e (Playwright уже в стеке): создать → перетащить → отфильтровать → экспорт.
- `CLAUDE.md`: добавить раздел про Retention Calendar (структура, repository-абстракция, точки
  интеграции с CG/TG, новый vite entry, изменения CSP), обновить дерево `public/`.

---

## Acceptance Criteria (ТЗ §17)

Готово, когда пользователь может: открыть Retention Calendar; создать кампанию вручную; сгенерировать
кампанию через существующий AI; положить/редактировать на календаре; drag&drop; фильтровать; сохранять
шаблоны; дублировать; экспортировать (CSV/JSON); видеть простые пересечения. Плюс: **из Campaign
Generator и Tournament Generator кампания/турнир добавляется на календарь одной кнопкой**; **получать
AI-рекомендации кампаний/турниров к праздникам и датам региона и добавлять их на календарь.**

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — зелёные.
- CSP не ослаблен по `scriptSrc` (бандл self-hosted).
- Persistence спрятана за `repo`-абстракцией (нет прямых `localStorage` в UI-коде).

---

## Future-proofing (§18) — заложить, не реализовывать

Async-контракт repo (→ Supabase/Postgres/multi-user), маппинг-слой AI отделён, экспорт расширяем
(Google Sheets / CRM), структура допускает будущие cadence-рекомендации и approval-workflow.
Не оверинжинирить сейчас, но не закладывать локал-онли тупики.

---

## Решения по scope

- **Brands:** single-brand сейчас, мультибренд — будущая задача. Поле `brands[]` остаётся в модели,
  brand-фильтр/селектор в UI скрыт (см. §3).
- **Retention Calendar:** добавляется как ещё один инструмент-агрегатор, объединяющий остальные;
  лендинг остаётся (см. §2).
- **Экспорт:** MVP — только CSV/JSON. XLSX отложен, слой экспорта спроектировать расширяемым (см. §10).
