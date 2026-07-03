# AUTH_IMPLEMENTATION_PLAN.md — Логин/пароль + постоянное хранение данных

**Статус:** План v1, ожидает подтверждения. Дата: 2026-07-02.
**Заменяет объём:** Sprint 5 (F1–F12) из `ROADMAP.md`, но с урезанным скоупом — см. «Что не входит».
**Связанные файлы:** `AUTH_WORKSPACE_DESIGN.md` (полный дизайн v2 с ролями/инвайтами/тарифами — остаётся источником для будущей фазы), `ROADMAP.md` (группа F).

---

## 1. Объём (решено с пользователем)

- **Auth:** email + пароль (bcrypt hash), JWT в httpOnly cookie.
- **Workspace:** создаётся автоматически при регистрации, 1 workspace = 1 пользователь (`owner_id`). Без ролей, без участников, без инвайтов, без тарифных лимитов на AI-вызовы — это задел на будущее (см. §9).
- **Постоянное хранение:** всё, что сейчас лежит в localStorage как *данные пользователя* (сохранённые кампании, турниры, программы лояльности, календарь), переезжает в Postgres, привязанное к `workspace_id`.
- **БД:** Postgres на Neon (serverless, уже совместим с текущим деплоем на Vercel).
- **Не входит в этот план** (осталось в `AUTH_WORKSPACE_DESIGN.md` как «Фаза 2/4» на будущее): роли viewer/member/admin/owner, `workspace_members`, инвайты по email, тарифные планы free/solo/pro/team, `checkAiLimit`/`checkWorkspaceLimit`, upgrade-flow.

---

## 2. Инвентаризация данных, которые нужно перенести

Проверено по факту в `public/*.js` (не всё из этого списка задокументировано в `CLAUDE.md`):

| localStorage key | Кто пишет | Что хранит |
|---|---|---|
| `cfgSaved` | `configurator.js` → `saveCfgEntry()` | Сохранённые конфиги из унифицированного Configurator (bonus/tournament/loyalty вперемешку), запись `{id, type, name, createdAt, params, result}` |
| `be_campaigns` | `campaign-generator.js` | Сохранённые AI-кампании (Campaign Generator); также источник для `reports.js` |
| `savedTournaments` | `tournament-generator.js` | Сохранённые турниры |
| `savedLoyaltyPrograms` | `loyalty-generator.js` | Сохранённые программы лояльности |
| `rc_campaigns` | `retention-calendar/repository.js` | Календарь — все события |
| `rc_templates` | `retention-calendar/repository.js` | Календарь — шаблоны кампаний |

Остальные ключи (`bonusLang`, `cfg_type`, `cg_expert_mode`, `cookieConsent`, `*_target_roi`, `*_hint_dismissed`, `*_onboarding_done`) — это UI-preferences, не пользовательские данные, **остаются в localStorage** как есть.

**Важное наблюдение:** `retention-calendar/repository.js` уже написан как асинхронный слой (`Promise`-based CRUD поверх localStorage) — это готовый repository-паттерн. Перевод календаря на API — замена тела функций внутри одного файла, без изменений в `store.js`/`calendar.js`/UI. Остальные 4 модуля (`configurator.js`, `campaign-generator.js`, `tournament-generator.js`, `loyalty-generator.js`) обращаются к `localStorage` напрямую инлайн — для них нужно выделить такой же тонкий repository-слой перед переключением на API.

---

## 3. Схема БД

```sql
-- Пользователи
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Workspace: 1:1 с пользователем в этой фазе (owner_id уникален).
-- Отдельная таблица — задел на будущий multi-user без миграции схемы.
CREATE TABLE workspaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_id   UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Сохранённые конфиги из унифицированного Configurator (замена cfgSaved)
CREATE TABLE saved_configs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,   -- 'bonus' | 'tournament' | 'loyalty'
  name         TEXT        NOT NULL,
  params       JSONB       NOT NULL,
  result       JSONB       NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- AI-кампании из Campaign Generator (замена be_campaigns)
CREATE TABLE ai_campaigns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Сохранённые турниры (замена savedTournaments)
CREATE TABLE saved_tournaments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Сохранённые программы лояльности (замена savedLoyaltyPrograms)
CREATE TABLE saved_loyalty_programs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Retention Calendar — события (замена rc_campaigns)
CREATE TABLE calendar_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data         JSONB       NOT NULL,   -- полный объект campaign (type/segment/dates/econ/...)
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Retention Calendar — шаблоны (замена rc_templates)
CREATE TABLE calendar_templates (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_configs_ws    ON saved_configs(workspace_id, created_at DESC);
CREATE INDEX idx_ai_campaigns_ws     ON ai_campaigns(workspace_id, created_at DESC);
CREATE INDEX idx_saved_tourn_ws      ON saved_tournaments(workspace_id, created_at DESC);
CREATE INDEX idx_saved_loyalty_ws    ON saved_loyalty_programs(workspace_id, created_at DESC);
CREATE INDEX idx_calendar_events_ws  ON calendar_events(workspace_id, updated_at DESC);
CREATE INDEX idx_calendar_templates_ws ON calendar_templates(workspace_id, created_at DESC);
```

Данные хранятся как `JSONB` (не разбираются на колонки) — это сохраняет полную совместимость с текущими JS-структурами на фронтенде и не требует ORM-маппинга; risk/economics-объекты меняются часто, жёсткая схема добавила бы миграции на каждое изменение фичи.

---

## 4. Auth / сессии

- JWT payload: `{ sub: userId, name, email, iat, exp }`, срок 7 дней, rolling expiry.
- Хранение: httpOnly + Secure + SameSite=Strict cookie `_bt`, недоступна из JS (без риска XSS-кражи токена).
- `workspaceId` пользователю передавать не нужно на фронт явно (1 workspace на пользователя) — сервер сам резолвит `workspace_id` по `req.user.id` в middleware.

---

## 5. Новые файлы (backend, по существующим конвенциям проекта)

Следуя паттернам `CLAUDE.md`: factory-инъекция контроллеров, `asyncHandler`, Zod-валидация, `services/` — тонкие обёртки над `use-cases`/`domain`.

```
src/
├── db/
│   └── client.ts                     # Neon/pg singleton (Pool)
├── domain/
│   └── auth/
│       ├── hashPassword.ts           # bcrypt hash + verify
│       └── jwt.ts                    # sign + verify
├── use-cases/
│   └── SavedItems.ts                 # generic CRUD use-case, параметризован таблицей
├── controllers/
│   ├── auth.controller.ts            # register, login, logout, me
│   └── savedItems.controller.ts      # CRUD для 4-х таблиц saved_* + 2-х calendar_*
├── routes/
│   ├── auth.routes.ts                # /api/auth/*
│   └── savedItems.routes.ts          # /api/configs, /api/campaigns, /api/tournaments,
│                                      #   /api/loyalty-programs, /api/calendar/events,
│                                      #   /api/calendar/templates
├── middleware/
│   └── requireAuth.ts                # JWT cookie → req.user + req.workspaceId
└── validation/
    ├── auth.schema.ts                # RegisterSchema, LoginSchema
    └── savedItems.schema.ts          # схемы под каждую сущность
```

**Скрипт миграции БД:** `src/db/migrations/001_initial.sql` (SQL из §3), применяется вручную через `psql $DATABASE_URL -f ...` при первом деплое (без ORM/миграционного фреймворка — не оправдано для 8 таблиц на этом этапе).

---

## 6. API routes

| Method | Path | Auth | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | — | Создаёт user + workspace, ставит cookie |
| POST | `/api/auth/login` | — | Проверяет пароль, ставит cookie |
| POST | `/api/auth/logout` | — | Чистит cookie |
| GET | `/api/auth/me` | ✓ | Текущий пользователь |
| GET/POST | `/api/configs` | ✓ | Список / создать (`saved_configs`) |
| DELETE | `/api/configs/:id` | ✓ | Удалить |
| GET/POST | `/api/campaigns` | ✓ | `ai_campaigns` (Campaign Generator) |
| DELETE | `/api/campaigns/:id` | ✓ | Удалить |
| GET/POST | `/api/tournaments` | ✓ | `saved_tournaments` |
| DELETE | `/api/tournaments/:id` | ✓ | Удалить |
| GET/POST | `/api/loyalty-programs` | ✓ | `saved_loyalty_programs` |
| DELETE | `/api/loyalty-programs/:id` | ✓ | Удалить |
| GET/POST/PATCH | `/api/calendar/events` / `/:id` | ✓ | `calendar_events` (drag/resize → PATCH) |
| DELETE | `/api/calendar/events/:id` | ✓ | Удалить |
| GET/POST/DELETE | `/api/calendar/templates` / `/:id` | ✓ | `calendar_templates` |

Существующие AI/generate/recalc-роуты (`/api/generate`, `/api/campaign/*`, `/api/tournament/*`, `/api/loyalty/*`) оборачиваются в `requireAuth`, но по содержанию не меняются.

---

## 7. Фронтенд

| Файл | Изменение |
|---|---|
| `public/login.html` + `public/login.js` (новые) | Форма входа → `POST /api/auth/login` |
| `public/register.html` + `public/register.js` (новые) | Форма регистрации → `POST /api/auth/register` |
| `public/nav-utils.js` | Показ имени пользователя + «Выйти» в хедере; редирект на `/login.html` при `401` от любого fetch |
| `public/retention-calendar/repository.js` | Тело `listCampaigns/saveCampaign/...` → `fetch('/api/calendar/events', {credentials:'include'})` вместо localStorage. Остальной модуль не трогаем — уже async-интерфейс. |
| `public/configurator.js` | Выделить `saveCfgEntry()`/список сохранённых в отдельный repo-слой → переключить на `/api/configs` |
| `public/campaign-generator.js` | Repo-слой для `be_campaigns` → `/api/campaigns` |
| `public/tournament-generator.js` | Repo-слой для `savedTournaments` → `/api/tournaments` |
| `public/loyalty-generator.js` | Repo-слой для `savedLoyaltyPrograms` → `/api/loyalty-programs` |
| Все `fetch()` к API | Добавить `credentials: 'include'` |

**Одноразовая миграция старых данных:** при первом успешном логине, если в localStorage ещё лежат `cfgSaved`/`be_campaigns`/`savedTournaments`/`savedLoyaltyPrograms`/`rc_campaigns`/`rc_templates` — фронт один раз отправляет их в соответствующие `POST`-эндпоинты пачкой, затем помечает флагом `migrated_v1=true` в localStorage (не удаляет исходные ключи сразу — на случай отката).

---

## 8. Фазы реализации и оценка

| Фаза | Задачи | ~Часы |
|---|---|---|
| **1 — Auth core** | Neon project + `001_initial.sql`, `db/client.ts`, `hashPassword`/`jwt`, `auth.controller` (register/login/logout/me), `auth.routes` + `requireAuth`, `login.html`+`register.html`, защита существующих AI-роутов | ~16h |
| **2 — Хранение данных** | `savedItems.controller`/`routes` (6 сущностей), Zod-схемы, unit-тесты domain-слоя | ~10h |
| **3 — Фронтенд: repo-слои** | Календарь → API (repository.js), Configurator/Campaign/Tournament/Loyalty generators → repo-слой + API, header с юзером/логаутом, редирект на 401 | ~14h |
| **4 — Миграция старых данных + QA** | Одноразовый импорт localStorage → API при первом логине, ручное тестирование каждого сохранения/загрузки, integration-тесты (`tests/integration/api.auth.test.js`, `api.savedItems.test.js`) | ~8h |

**Итого:** ~48 часов (~6 рабочих дней), меньше чем оригинальные ~4–5 дней из `AUTH_WORKSPACE_DESIGN.md` считались без учёта миграции фронтенда — здесь она учтена явно, т.к. без неё «постоянное хранение» не будет реально работать.

---

## 9. Отложено на будущее (осталось в `AUTH_WORKSPACE_DESIGN.md`)

Не реализуется в этом плане, но схема БД (`workspaces` как отдельная таблица, а не поле на `users`) намеренно оставляет путь к этому без переписывания:

- `workspace_members` + роли (viewer/member/admin/owner)
- Инвайты по email (`workspace_invites`, `/api/workspaces/:id/invite`)
- Несколько workspace на пользователя (переключатель в хедере)
- Тарифные планы free/solo/pro/team + `ai_usage` + `checkAiLimit`/`checkWorkspaceLimit`
- Upgrade-flow через email

---

## 10. Новые зависимости

```
pg                        # Postgres клиент
@neondatabase/serverless   # Neon adapter
bcrypt                    # хэш паролей
jsonwebtoken              # JWT
cookie-parser             # чтение httpOnly cookie в Express
```

## 11. Новые env vars

```
DATABASE_URL=postgresql://...@neon.tech/bonusengine
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRY=7d
COOKIE_DOMAIN=              # пусто локально, домен в проде
```

---

## 12. Открытые вопросы (нужно решить до старта Фазы 1)

1. **Email-верификация при регистрации** — предлагаю **не делать** в v1 (упрощает онбординг), добавить позже при появлении инвайтов.
2. **Восстановление пароля (forgot password)** — нужно ли в первой итерации, или можно вручную через Resend/поддержку пока пользователей мало? Предлагаю отложить, т.к. `RESEND_API_KEY` уже настроен и добавить `/api/auth/forgot-password` дёшево, но не блокирует MVP.
3. **Rate limiting на `/api/auth/login`** — добавить `authLimiter` (например 5 попыток/мин) поверх существующей инфраструктуры `express-rate-limit`. Предлагаю включить сразу — дёшево, закрывает brute-force.
4. **Что происходит с текущими пользователями без аккаунта** — на первом заходе после деплоя всех редиректим на `/register.html`? Или оставляем сайт доступным без логина, а хранение данных — опциональной фичей после регистрации? (Влияет на то, оборачивать ли *все* API в `requireAuth` или только `saved*`/`calendar/*`.)

---

## Следующий шаг

Дождаться подтверждения по этому плану (и ответов на открытые вопросы в §12) — затем начинаем с Фазы 1 согласно правилу проекта «подтверждение перед кодингом».
