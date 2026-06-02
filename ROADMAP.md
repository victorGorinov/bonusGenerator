# ROADMAP.md — BonusEngine

Все задачи с отслеживанием статуса. Дата: 2026-05-31.

---

## Источники задач

| Файл | Что содержит |
|---|---|
| `CLAUDE.md` | Pending work: Task A/B/C/D, тесты, frontend debt |
| `UX_DEV_PLAN.md` | P0 (R1–R4) и P1 (R5–R8) из UX-исследования |
| `FEATURE_CAMPAIGN_ANALYTICS.md` | Post-campaign аналитика (факт vs прогноз) |
| `FEATURE_PRIORITIZATION.md` | RICE-скоринг фич ретеншен-арсенала (#21 — лояльность, Score 25.0) |
| `LOYALTY_SPEC.md` + `LOYALTY_BUILD_INSTRUCTION.md` | Генератор программ лояльности: модель + пошаговый build |
| `SPORTSBOOK_SPEC.md` | Калькулятор бонусов спортбука (новая вертикаль) |
| `AUTH_WORKSPACE_DESIGN.md` | Авторизация + workspace + БД (4 фазы) |
| `REFACTORING_PLAN.md` | Технический долг (11 задач, 4 фазы) |

---

## Полный реестр задач

### Группа A — Tournament: сохранение и библиотека

| ID | Задача | Статус |
|---|---|---|
| A1 | Tournament save: localStorage helpers + `saveTournament()` + toast | ✅ Done |
| A2 | Tournament list view `renderList()` + sidebar "Tournaments" как button | ✅ Done |
| A3 | Tournament detail view `renderDetail(id)` | ✅ Done |
| A4 | `loadAndShowGuide()`, `loadAndRegenTexts()`, `deleteTournament()` | ✅ Done |
| A5 | Sidebar nav badge (счётчик) + `updateNavBadge()` | ✅ Done |
| A6 | `showView()` dispatcher + кнопка "Save" в Step 3 | ✅ Done |

### Группа B — AI-рекомендации (Campaign Generator)

| ID | Задача | Статус |
|---|---|---|
| B1 | Task C: убрать Reload из сценария first_launch в `campaign.service.ts` | ✅ Done |
| B2 | Task 14/D Part 1: кнопка "AI Recommendations" + `_cgRunOptimize()` | ✅ Done |
| B3 | Task 14/D Part 2: `_cgApplyRecs()` + полный ре-рендер Step 3 | ✅ Done |
| B4 | Task A: `_applyRecsToLift()` — показать delta lift после применения рекомендации | ⏳ Sprint 5 |
| B5 | Task B: AI review кнопка когда `netIncr > 0` (`mode:'review'` в optimize prompt) | ⏳ Sprint 5 |

### Группа C — UX P0: Доверие и навигация

| ID | Задача | Статус |
|---|---|---|
| C1 | R4-A: Disclaimer «AI draft» над текстами кампании (RU + EN) | ✅ Done |
| C2 | R4-B: Поле `rule` в AuditResponseSchema + prompt + отображение в аудите CG | ✅ Done |
| C3 | R4-C: То же для Tournament audit prompt | ✅ Done |
| C4 | R4-D: Timestamp аудита ("Audited: DD Mon YYYY, HH:MM") | ✅ Done |
| C5 | R1-C: Sidebar в Configurator (выровнять со структурой CG/TG) | ✅ Done |
| C6 | R2-A: Welcome/onboarding экран в Campaign Generator перед Step 1 | ✅ Done |
| C7 | R2-B: First-use hint в Bonus Configurator (dismissible banner) | ✅ Done |
| C8 | R3-A: Basic/Expert toggle в Step 3 Campaign Generator | ✅ Done |
| C9 | R3-B: Collapsible incremental revenue в Configurator | ✅ Done |

### Группа D — UX P1: Прозрачность и «последняя миля»

| ID | Задача | Статус |
|---|---|---|
| D1 | R6-A: Stale econ indicator в Configurator + кнопка Generate ↻ | ✅ Done |
| D2 | R6-B: Stale badge в Campaign Generator (players slider) | ✅ Done |
| D3 | R5-A: "Model assumptions" collapsible block (Configurator + CG) | ✅ Done |
| D4 | R5-B: Тултипы у 7 ключевых терминов | ✅ Done |
| D5 | R5-C: P10/P50/P90 sub-label с конверсией | ✅ Done |
| D6 | R8-A: "Copy all" кнопка по каналу в CG texts | ✅ Done |
| D7 | R8-B: Export campaign → PDF (browser print via Blob URL) | ✅ Done |
| D8 | R8-C: Export tournament → PDF | ✅ Done |
| D9 | R8-D: Export audit → отдельный PDF | ⏳ Sprint 5 |
| D10 | R7-A/B: Glossary panel (11 терминов, RU/EN) в CG + Configurator | ✅ Done |

### Группа E — Аналитика кампаний (post-campaign)

| ID | Задача | Статус |
|---|---|---|
| E1 | ForecastSnapshot: захват при сохранении кампании (localStorage) | ✅ Done |
| E2 | `compareCampaign()` domain function (variance, forecast accuracy, ROI) | ✅ Done |
| E3 | UI: ввод актуальных данных (manual input form) | ✅ Done |
| E4 | UI: "Forecast vs Actual" карточка в детали кампании | ✅ Done |
| E5 | Portfolio dashboard — artifact (live artifact, все кампании) | ⏳ Sprint 6 |
| E6 | CSV import актуальных данных | ⏳ Sprint 6 |

### Группа F — Авторизация и workspace

| ID | Задача | Статус |
|---|---|---|
| F1 | Neon DB + `001_initial.sql` (6 таблиц) | ⏳ Sprint 5 |
| F2 | `src/db/client.ts` — pg singleton | ⏳ Sprint 5 |
| F3 | `src/domain/auth/` — hashPassword + JWT sign/verify | ⏳ Sprint 5 |
| F4 | `auth.controller.ts` — register, login, logout, me | ⏳ Sprint 5 |
| F5 | `auth.routes.ts` + `requireAuth.ts` middleware | ⏳ Sprint 5 |
| F6 | `public/login.html` + `public/register.html` | ⏳ Sprint 5 |
| F7 | Защитить все AI-routes через `requireAuth` | ⏳ Sprint 5 |
| F8 | `workspace.controller.ts` — CRUD | ⏳ Sprint 5 |
| F9 | `requireWorkspaceMember.ts` + `checkWorkspaceLimit.ts` | ⏳ Sprint 5 |
| F10 | `checkAiLimit.ts` — atomic upsert ai_usage + 429 при превышении | ⏳ Sprint 5 |
| F11 | Workspace switcher в header + AI-счётчик (UI) | ⏳ Sprint 5 |
| F12 | `public/settings.html` — участники, план, лимиты | ⏳ Sprint 5 |
| F13 | Campaigns API `/api/workspaces/:id/campaigns` | ⏳ Sprint 6 |
| F14 | Переключить `configurator.html` + `app.js` с localStorage на API | ⏳ Sprint 6 |
| F15 | Переключить `campaign-generator.html` на API | ⏳ Sprint 6 |
| F16 | Invite API: токен + email (Resend) + `/join` страница | ⏳ Sprint 6 |
| F17 | `POST /api/upgrade-request` + Toast при `AI_LIMIT_EXCEEDED` | ⏳ Sprint 6 |
| F18 | `src/scripts/setPlan.ts` — admin CLI | ⏳ Sprint 6 |

### Группа G — Технический рефакторинг

| ID | Задача | Статус |
|---|---|---|
| G1 | F1: Typed DTOs — `z.infer` типы во всех схемах и контроллерах | ✅ Done |
| G2 | F2: EnvSchema + fail-fast + AI_MODEL в config | ✅ Done |
| G3 | F3: `asyncHandler` wrapper — убрать try/catch из контроллеров | ✅ Done |
| G4 | F4: Exponential backoff + `isRetryable()` в AI provider | ✅ Done |
| G5 | F9: `requestId` middleware + structured AI event logging + cost_usd | ✅ Done |
| G6 | F5: Domain layer — shared value objects + typed interfaces | ✅ Done |
| G7 | F6: `AIProvider` interface + registry + MockAIProvider | ✅ Done |
| G8 | F7: Use-case layer (`src/use-cases/`) | ✅ Done |
| G9 | F8: Factory injection для контроллеров | ✅ Done |
| G10 | F11: CI pipeline (GitHub Actions: typecheck, lint, test, audit) | ✅ Done |
| G11 | F10-a: Вынести inline JS из HTML в external files | ✅ Done (досрочно) |
| G12 | F10-b: Vite build setup | ✅ Done (досрочно) |
| G13 | F10-c: CSP hardening — убрать `'unsafe-inline'` из scriptSrc | ✅ Done (досрочно) |
| G14 | Тесты: DK snapshot + RU/KZ/MN payout fallback coverage | ✅ Done |

### Группа H — Фичи ретеншен-арсенала (FEATURE_PRIORITIZATION NOW/NEXT)

| ID | Задача | RICE | Статус |
|---|---|---|---|
| H1 | CRM/CDP export + копирование текстов в рассылку | 40.0 | ⏳ Sprint 7 |
| H2 | Approval-flow + аудиторский след кампании | 33.3 | ⏳ После auth |
| H3 | Шаблоны / библиотека кампаний | 30.0 | ⏳ Sprint 7 |
| H4 | Детекция бонус-абьюза / уязвимостей механики | 20.0 | ⏳ Sprint 7 |
| H5 | ~~Лестница лояльности / VIP-тиры~~ → консолидирована в группу I | 20.0 | ➡️ см. I |
| H6 | A/B-тестирование механик и текстов | 16.0 | ⏳ Q3 |
| H7 | RG-гейты внутри механики (ROFUS/GAMSTOP) | 16.0 | ⏳ Q3 |
| H8 | Динамические сегменты + поведенческие триггеры | 16.0 | ⏳ Q4 |
| H9 | Импорт реальных данных игроков | 15.0 | ⏳ Q4 |
| H10 | ~~Миссии и квесты~~ → как hybrid-слой в группе I (полная геймификация — позже) | 20.0 | ➡️ см. I |

### Группа I — Генератор программ лояльности (RICE 25.0, NEXT-топ)

Консолидирует H5 (тиры) + H10 (миссии) в единый hybrid-генератор. Спек: `LOYALTY_SPEC.md`, build: `LOYALTY_BUILD_INSTRUCTION.md`. **Не зависит от auth** (localStorage-first). Каждый шаг: план → подтверждение → реализация → тесты.

| ID | Задача | Размер | Статус |
|---|---|---|---|
| I1 | Доменное ядро `src/domain/loyalty/` (tiers, earnRedeem, missions, rewardCatalog, retentionLift) + тесты | L | ⏳ Sprint 7 |
| I2 | Zod-схемы + use-case + service + controller + `/api/loyalty/generate|recalc` + интеграционный тест | M | ⏳ Sprint 7 |
| I3 | Frontend `loyalty-generator.html` + `.js` (Step 1–4, hybrid, live-превью, совокупный costRatio, save-библиотека) | L | ⏳ Sprint 7 |
| I4 | AI-слой: prompts + parser-схемы + `/texts|audit|optimize` (UKGC safer-gambling hard-fail) + Mock-тесты | L | ⏳ Sprint 8 |
| I5 | Optimize-solver (бюджет→параметры) + регуляторные снапшоты (UK/EU/DK) + обновить CLAUDE.md | M | ⏳ Sprint 8 |

---

## Прогресс

| Группа | Всего | Готово | Осталось |
|---|---|---|---|
| A — Tournament Save | 6 | **6** ✅ | 0 |
| B — AI Рекомендации | 5 | **3** | 2 |
| C — UX P0 | 9 | **9** ✅ | 0 |
| D — UX P1 | 10 | **9** | 1 |
| E — Analytics | 6 | **4** | 2 |
| G — Refactor | 14 | **14** ✅ | 0 |
| F — Auth + DB | 18 | 0 | **18** |
| H — Feature Expansion | 10 | 0 | **10** (H5/H10 → группа I) |
| I — Loyalty Generator | 5 | 0 | **5** |
| **Итого** | **83** | **45** (54%) | **38** |

---

## Критический путь — обновлён 2026-05-31

```
✅ Tournament save (A) + UX P0/P1 (C, D) + Analytics v1 (E1–E4) — DONE
✅ Refactor Phase 1–3 (G1–G14) — DONE (включая Vite/CSP досрочно)
   ↓
⏳ Auth Phases 1–2 (F1–F12) — следующий Sprint 5
   ↓
⏳ DB Migration (F13–F15) + Auth Phases 3–4 (F16–F18) — Sprint 6
   ↓
⏳ Loyalty Generator core (I1–I3) + Feature expansion (H1, H3, H4) — Sprint 7
   ↓
⏳ Loyalty AI/solver (I4–I5) + Scale & Advanced (H6–H9) — Sprint 8+
```

**Параллельный трек:** I1–I5 не зависят от auth (localStorage-first) — могут идти независимо от F-группы, ограничены только командной ёмкостью.

**Разблокировано сейчас:** G5–G10 выполнены → Auth (F1–F12) можно начинать немедленно.

---

## ROADMAP — Спринты

### ✅ Sprint 1 — Tournament Library + AI Trust — ЗАВЕРШЁН

Выполнено: A1–A6, C1–C4, G2, G4, B1.

---

### ✅ Sprint 2 — UX P0: Навигация и онбординг — ЗАВЕРШЁН

Выполнено: C5–C9, G1, G3.

---

### ✅ Sprint 3 — UX P1 + Campaign Analytics v1 — ЗАВЕРШЁН

Выполнено: D1–D8, D10, E1–E4, B2, B3, G14.

---

### ✅ Sprint 4 — Refactor Backend + CI — ЗАВЕРШЁН (досрочно включая Sprint 7 G-задачи)

Выполнено: G5–G13 (G11–G13 выполнены досрочно — были запланированы на Sprint 7).

---

### Sprint 5 — Auth Core + Workspaces (следующий, 2 недели)

**Цель:** пользователи могут регистрироваться, логиниться, работать в изолированных workspace.

**Предусловие:** ✅ G5–G10 выполнены — backend готов к auth.

| ID | Задача | ~Hours |
|---|---|---|
| F1 | Neon DB + initial.sql | 2h |
| F2 | pg singleton | 0.5h |
| F3 | hashPassword + JWT | 2h |
| F4 | auth.controller (register/login/logout/me) | 4h |
| F5 | auth.routes + requireAuth middleware | 2h |
| F6 | login.html + register.html | 4h |
| F7 | Protect AI routes | 1h |
| F8 | workspace.controller (CRUD) | 4h |
| F9 | requireWorkspaceMember + checkWorkspaceLimit | 2h |
| F10 | checkAiLimit (atomic upsert + 429) | 2h |
| F11 | Workspace switcher UI + AI counter | 3h |
| F12 | settings.html | 4h |
| B4 | `_applyRecsToLift()` — projected lift delta | 2h |
| B5 | AI review при `netIncr > 0` | 2h |
| D9 | Export audit → PDF | 2h |

**Deliverable:** пользователи регистрируются, работают в своих workspace с AI-квотами. Remaining P1 UX items закрыты.

---

### Sprint 6 — DB Migration + Invite Flow (2 недели)

**Цель:** данные переезжают из localStorage в БД.

| ID | Задача | ~Hours |
|---|---|---|
| F13 | Campaigns API | 4h |
| F14 | Configurator → API | 6h |
| F15 | Campaign Generator → API | 6h |
| F16 | Invite API + /join страница | 4h |
| F17 | Upgrade request + AI_LIMIT_EXCEEDED toast | 2h |
| F18 | setPlan.ts CLI | 1h |
| E5 | Portfolio dashboard (все кампании) | 4h |
| E6 | CSV import актуальных данных | 3h |

**Deliverable:** данные персистентны между устройствами. Команды работают вместе.

---

### Sprint 7 — Feature Expansion (2 недели)

**Цель:** приоритетные фичи ретеншена + старт генератора лояльности (RICE-топ NEXT, без auth-зависимости).

| ID | Задача | ~Hours |
|---|---|---|
| I1 | Loyalty: доменное ядро + тесты | 10h |
| I2 | Loyalty: API generate/recalc | 5h |
| I3 | Loyalty: frontend Step 1–4 | 10h |
| H1 | CRM/CDP export + интеграции | 6h |
| H3 | Шаблоны / библиотека кампаний | 6h |
| H4 | Детекция бонус-абьюза | 5h |

**Deliverable:** работающий генератор программ лояльности (без AI). Оператор переиспользует удачные конфиги, система детектирует уязвимые механики.

---

### Sprint 8+ — Scale & Advanced Features

| ID | Задача | Когда |
|---|---|---|
| I4 | Loyalty: AI-слой (texts/audit/optimize) | Sprint 8 |
| I5 | Loyalty: optimize-solver + регуляторные снапшоты | Sprint 8 |
| H2 | Approval-flow + аудиторский след | После auth |
| H6 | A/B-тестирование | Q3 |
| H7 | RG-гейты (ROFUS/GAMSTOP) | Q3 |
| H8 | Динамические сегменты | Q4 |
| H9 | Импорт данных игроков | Q4 |
| — | Sportsbook MVP (free bet) — новая вертикаль, `SPORTSBOOK_SPEC.md` | Q4 (после loyalty) |
| — | Полная геймификация (streak/динамические челленджи) поверх I | Q4 |
| — | AI response caching (Redis) | При cost > $50/mo |
| — | Queue для тяжёлых генераций (Bull) | При >20 concurrent users |
| — | OpenAPI от Zod-схем | Перед публичным API |

---

## Сводный план по времени — обновлён

```
Май 2026
  ✅ Sprint 1 — Tournament Library + AI Trust
  ✅ Sprint 2 — UX P0: Навигация + Онбординг
  ✅ Sprint 3 — UX P1 + Campaign Analytics v1
  ✅ Sprint 4 — Backend Refactor + CI + Vite/CSP (досрочно)

Июнь 2026
  ⏳ Sprint 5 (2 нед) — Auth Core + Workspaces + B4/B5/D9

Июль 2026
  ⏳ Sprint 6 (2 нед) — DB Migration + Invite Flow + Analytics v2

Август 2026
  ⏳ Sprint 7 (2 нед) — Loyalty Generator core (I1–I3) + Feature Expansion (H1, H3, H4)

Q3–Q4 2026
  ⏳ Sprint 8+        — Loyalty AI/solver (I4–I5) + Scale & Advanced + Sportsbook MVP
```

---

## Зависимости (обновлено)

```
✅ A, C, D, B1-B3, E1-E4, G (все)    — выполнено

⏳ B4, B5, D9                         → зависит от: ничего (можно в любой Sprint)
⏳ F1–F12 (Auth Phases 1–2)           → зависит от: G5–G10 ✅ — РАЗБЛОКИРОВАНО
⏳ F13–F18 (Auth Phases 3–4)          → зависит от: F1–F12
⏳ E5–E6 (Analytics v2)               → зависит от: F13 (campaigns в БД)
⏳ H1, H3 (Feature NOW)               → зависит от: F14–F15 (DB migration)
⏳ H2 (Approval-flow)                 → зависит от: F1–F12 (auth) + H3
⏳ I1–I5 (Loyalty Generator)          → зависит от: ничего (localStorage-first) — можно начинать сразу
⏳ H6, H8 (Feature NEXT)              → зависит от: H9 (импорт данных)
⏳ Sportsbook MVP                     → зависит от: I (после loyalty, переиспользует паттерн вертикали)
```

---

## Легенда

| Символ | Значение |
|---|---|
| ✅ Done | Реализовано и задеплоено |
| ⏳ Sprint N | Запланировано в Sprint N |
| ⏳ Q3/Q4 | Квартальный горизонт |

| Размер | Оценка |
|---|---|
| XS | < 1 hour |
| S | 1–3 hours |
| M | 3–6 hours |
| L | 6–12 hours |
| XL | 12+ hours |
