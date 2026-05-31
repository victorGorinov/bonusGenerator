# Auth & Multi-Client Workspace — Design Document

**Stack:** PostgreSQL (Neon serverless) + JWT httpOnly cookie  
**Дата:** май 2026  
**Статус:** Design v2 — с планами, лимитами и трекингом AI-генераций

---

## Концепция

Система поддерживает двух типов пользователей:
- **Оператор** — одна компания, один workspace, несколько пользователей (Bonus Manager + Head of CRM)
- **Консультант** — один пользователь, несколько workspaces (по одному на каждого клиента)

Workspace = изолированное пространство с собственными кампаниями, настройками и участниками.

---

## Схема базы данных

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

-- Workspaces (один на клиента у консультанта, или один на компанию у оператора)
CREATE TABLE workspaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
  plan       TEXT        NOT NULL DEFAULT 'free',  -- 'free' | 'solo' | 'pro' | 'team'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Участники workspace с ролями
CREATE TABLE workspace_members (
  workspace_id UUID  REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID  REFERENCES users(id)      ON DELETE CASCADE,
  role         TEXT  NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member' | 'viewer'
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Сохранённые кампании (заменяет localStorage savedCampaigns)
CREATE TABLE campaigns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT        NOT NULL,
  params       JSONB       NOT NULL,
  mechanics    JSONB,
  economics    JSONB,
  overrides    JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Инвайты в workspace по email
CREATE TABLE workspace_invites (
  token        TEXT        PRIMARY KEY,
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email TEXT       NOT NULL,
  invited_by   UUID        REFERENCES users(id),
  role         TEXT        NOT NULL DEFAULT 'member',
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ
);

-- AI-использование (счётчик на workspace × месяц)
CREATE TABLE ai_usage (
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month        TEXT        NOT NULL,  -- 'YYYY-MM', например '2026-05'
  ai_calls     INTEGER     NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, month)
);

-- Индексы
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_campaigns_workspace    ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_updated      ON campaigns(workspace_id, updated_at DESC);
CREATE INDEX idx_ai_usage_month         ON ai_usage(workspace_id, month);
```

---

## Система планов и лимиты

### Таблица планов

| Параметр | `free` | `solo` | `pro` | `team` |
|---|---|---|---|---|
| **Цена** | $0 | $49/мес | $99/мес | $299/мес |
| **Целевой пользователь** | Попробовать | Консультант / фриланс | Bonus Manager в команде | Оператор / агентство |
| **Workspaces** (на пользователя) | 1 | 10 | 5 | 20 |
| **Участников** в workspace | 1 (только owner) | 1 | 5 | без лимита |
| **AI-вызовов / месяц** (на workspace) | 10 | 200 | 100 | 500 |
| **Сохранённых кампаний** | 20 | без лимита | без лимита | без лимита |
| **Генераций без AI** | без лимита | без лимита | без лимита | без лимита |

**Логика планов:**
- `free` — пробный: хватит на 2–3 полных цикла (generate → texts → audit), не рабочий постоянно
- `solo` — консультант с несколькими клиентами: много workspaces, один пользователь, 200 AI-вызовов (~20 на клиента/мес при 10 клиентах)
- `pro` — команда внутри одного оператора: 1–2 workspace, до 5 коллег, 100 AI-вызовов
- `team` — крупный оператор или агентство: много workspace для брендов/гео, неограниченная команда

### Что считается AI-вызовом

Каждый HTTP-запрос к следующим endpoints = **1 AI-вызов**:

| Endpoint | Токенов (прибл.) | Стоимость/вызов |
|---|---|---|
| `POST /api/campaign/texts` | ~4 500 | ~$0.009 |
| `POST /api/campaign/audit` | ~1 200 | ~$0.002 |
| `POST /api/campaign/optimize` | ~800 | ~$0.002 |
| `POST /api/tournament/texts` | ~4 500 | ~$0.009 |
| `POST /api/tournament/audit` | ~1 200 | ~$0.002 |

**Не считаются** AI-вызовами (бесплатно для всех планов):
- `POST /api/generate` — чистая математика buildConfig
- `POST /api/recalc` — пересчёт параметров
- `POST /api/campaign/generate` — buildConfig + объяснения (без LLM)
- `POST /api/tournament/generate` — то же

### Месячный бюджет токенов по плану

| План | AI-вызовов/мес | Макс. стоимость токенов | Цена плана | Маржа |
|---|---|---|---|---|
| free | 10 | ~$0.09 | $0 | — |
| solo | 200 | ~$1.80 | $49 | ~$47 |
| pro | 100 | ~$0.90 | $99 | ~$98 |
| team | 500 | ~$4.50 | $299 | ~$294 |

### Лимиты workspaces

Лимит проверяется **на пользователя**: считаем workspaces, где `user_id = req.user.id AND role = 'owner'`.

```
free:  max 1
solo:  max 10
pro:   max 5
team:  max 20
```

---

## JWT-токен

**Payload:**
```json
{
  "sub":  "user-uuid",
  "name": "James O'Brien",
  "email": "james@example.com",
  "iat":  1716000000,
  "exp":  1716604800
}
```

- Срок: **7 дней**, обновляется при каждом запросе (rolling expiry)
- Хранится в **httpOnly, Secure, SameSite=Strict cookie** `_bt` — не доступен из JS
- Текущий workspace: клиент хранит `currentWorkspaceId` в `localStorage` и передаёт в заголовке `X-Workspace-Id`
- Проверка доступа к workspace — на сервере через `workspace_members`

---

## API Routes

### Auth — `/api/auth`

| Method | Path | Body | Описание |
|--------|------|------|---------|
| POST | `/api/auth/register` | `{ email, password, name }` | Регистрация + создание первого workspace |
| POST | `/api/auth/login` | `{ email, password }` | Вход, устанавливает cookie `_bt` |
| POST | `/api/auth/logout` | — | Очищает cookie |
| GET | `/api/auth/me` | — | Текущий пользователь + список его workspaces |

**POST /register — автоматически:**
1. Создаёт пользователя
2. Создаёт workspace `"{name}'s Workspace"` с ролью `owner`
3. Возвращает пользователя + JWT

### Workspaces — `/api/workspaces`

| Method | Path | Доступ | Описание |
|--------|------|--------|---------|
| GET | `/api/workspaces` | auth | Список workspaces пользователя |
| POST | `/api/workspaces` | auth | Создать новый workspace (для консультанта — новый клиент) |
| GET | `/api/workspaces/:id` | member | Детали + список участников |
| PATCH | `/api/workspaces/:id` | admin | Переименовать workspace |
| DELETE | `/api/workspaces/:id` | owner | Удалить workspace со всеми кампаниями |
| POST | `/api/workspaces/:id/invite` | admin | Пригласить по email, отправить ссылку |
| POST | `/api/workspaces/join/:token` | auth | Принять приглашение |
| DELETE | `/api/workspaces/:id/members/:userId` | admin | Удалить участника |

### Campaigns — `/api/workspaces/:id/campaigns`

| Method | Path | Доступ | Описание |
|--------|------|--------|---------|
| GET | `/api/workspaces/:id/campaigns` | member | Список кампаний workspace |
| POST | `/api/workspaces/:id/campaigns` | member | Сохранить кампанию |
| GET | `/api/workspaces/:id/campaigns/:cid` | member | Получить кампанию |
| PATCH | `/api/workspaces/:id/campaigns/:cid` | member | Обновить (edit mode) |
| DELETE | `/api/workspaces/:id/campaigns/:cid` | admin | Удалить |

---

## Роли и права

| Действие | viewer | member | admin | owner |
|----------|--------|--------|-------|-------|
| Просматривать кампании | ✅ | ✅ | ✅ | ✅ |
| Генерировать кампании | ❌ | ✅ | ✅ | ✅ |
| Сохранять кампании | ❌ | ✅ | ✅ | ✅ |
| Удалять кампании | ❌ | свои | ✅ | ✅ |
| Переименовать workspace | ❌ | ❌ | ✅ | ✅ |
| Приглашать участников | ❌ | ❌ | ✅ | ✅ |
| Удалять участников | ❌ | ❌ | ✅ | ✅ |
| Удалить workspace | ❌ | ❌ | ❌ | ✅ |

---

## Middleware лимитов

### `requireAuth.ts`
Декодирует JWT из httpOnly cookie `_bt`, кладёт `req.user = { id, email, name }`. При ошибке → 401.

### `requireWorkspaceMember.ts`
Принимает минимальную роль: `requireWorkspaceMember('member')`.  
Читает `X-Workspace-Id` из заголовка, проверяет запись в `workspace_members`. При недостаточной роли → 403.

### `checkAiLimit.ts` ← новый

```typescript
// src/middleware/checkAiLimit.ts
export function checkAiLimit(): RequestHandler {
  return async (req, res, next) => {
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) return next(new AppError('Workspace required', 400));

    const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // Upsert + atomic increment, вернуть новое значение
    const { rows } = await db.query(`
      INSERT INTO ai_usage (workspace_id, month, ai_calls)
      VALUES ($1, $2, 1)
      ON CONFLICT (workspace_id, month)
      DO UPDATE SET ai_calls = ai_usage.ai_calls + 1, updated_at = NOW()
      RETURNING ai_calls
    `, [workspaceId, month]);

    const used = rows[0].ai_calls;

    // Получить план workspace
    const { rows: ws } = await db.query(
      'SELECT plan FROM workspaces WHERE id = $1', [workspaceId]
    );
    const plan = ws[0]?.plan ?? 'free';
    const limits: Record<string, number> = { free: 10, solo: 200, pro: 100, team: 500 };
    const limit = limits[plan] ?? 10;

    if (used > limit) {
      // Откатить инкремент
      await db.query(`
        UPDATE ai_usage SET ai_calls = ai_calls - 1
        WHERE workspace_id = $1 AND month = $2
      `, [workspaceId, month]);

      return res.status(429).json({
        code: 'AI_LIMIT_EXCEEDED',
        message: `AI call limit reached for ${plan} plan (${limit}/month). Upgrade to continue.`,
        used: used - 1,
        limit,
        plan,
      });
    }

    // Добавить в ответ заголовки для UI
    res.setHeader('X-AI-Used',  String(used));
    res.setHeader('X-AI-Limit', String(limit));
    next();
  };
}
```

**Применение к AI-routes в `campaign.routes.ts` и `tournament.routes.ts`:**
```typescript
// До:
router.post('/texts',    aiLimiter, validate(TextsSchema),    ctrl.texts);

// После:
router.post('/texts',    aiLimiter, checkAiLimit(), validate(TextsSchema), ctrl.texts);
router.post('/audit',    aiLimiter, checkAiLimit(), validate(AuditSchema),  ctrl.audit);
router.post('/optimize', aiLimiter, checkAiLimit(), validate(OptimizeSchema), ctrl.optimize);
```

### `checkWorkspaceLimit.ts` ← новый

Проверяется при `POST /api/workspaces` (создание нового workspace):

```typescript
export function checkWorkspaceLimit(): RequestHandler {
  return async (req, res, next) => {
    const userId = req.user!.id;

    // Считаем workspaces где пользователь — owner
    const { rows } = await db.query(`
      SELECT w.plan,
             COUNT(wm.workspace_id) OVER() AS owned_count
      FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND wm.role = 'owner'
      LIMIT 1
    `, [userId]);

    // Если нет ни одного — разрешить (создаётся первый)
    if (!rows.length) return next();

    const ownedCount = Number(rows[0].owned_count);
    const plan = rows[0].plan;
    const limits: Record<string, number> = { free: 1, solo: 10, pro: 5, team: 20 };
    const limit = limits[plan] ?? 1;

    if (ownedCount >= limit) {
      return res.status(403).json({
        code: 'WORKSPACE_LIMIT_EXCEEDED',
        message: `Workspace limit reached for ${plan} plan (${limit} workspaces). Upgrade to create more.`,
        owned: ownedCount,
        limit,
        plan,
      });
    }
    next();
  };
}
```

### Upgrade flow (v1 — email, без Stripe)

При `429 AI_LIMIT_EXCEEDED` или нажатии "Upgrade" в header:

**Toast-уведомление** (появляется поверх интерфейса):
```
┌──────────────────────────────────────────────────────┐
│ 🔒 AI limit reached  (pro: 100/month)                │
│ You've used all 100 AI calls for May 2026.           │
│                                                      │
│ Upgrade to Team (500/month) or get in touch.         │
│                                                      │
│  [  Request Upgrade  ]    [  Dismiss  ]              │
└──────────────────────────────────────────────────────┘
```

**Кнопка "Request Upgrade"** → модальное окно с формой:
```
┌──────────────────────────────────────────┐
│  Upgrade your plan                       │
│                                          │
│  Your workspace: Acme Casino             │
│  Current plan:   Pro                     │
│  Requested:      [Pro ▾ / Team ▾]        │
│                                          │
│  Message (optional): __________________ │
│                       __________________ │
│                                          │
│  [   Send upgrade request   ]            │
└──────────────────────────────────────────┘
```

**POST `/api/upgrade-request`** — новый endpoint (без auth middleware, только rate-limit):
```typescript
// Body: { workspaceId, workspaceName, userEmail, userName, currentPlan, requestedPlan, message? }
// → Resend email → NOTIFY_EMAIL
// Subject: "Upgrade request: {userName} ({userEmail}) — {workspaceName}: {currentPlan} → {requestedPlan}"
// → res.json({ ok: true })
```

Email приходит на `NOTIFY_EMAIL` (victor.gorinov@gmail.com) — ручное подтверждение, затем оператор меняет `plan` в БД вручную через SQL или простую admin-команду.

**Admin команда для смены плана** (через `tsx` REPL или отдельный скрипт):
```bash
# src/scripts/setPlan.ts
# npm run set-plan -- --workspace=<id> --plan=pro
```

---

### UI — отображение лимитов

В response на `/api/auth/me` возвращать текущее использование:
```json
{
  "user": { "id": "...", "name": "James", "email": "james@..." },
  "workspaces": [
    {
      "id": "...", "name": "Acme Casino", "role": "owner", "plan": "pro",
      "aiUsage": { "used": 47, "limit": 100, "month": "2026-05" }
    }
  ]
}
```

В header всех SPA — индикатор оставшихся AI-вызовов:
```
[🏢 Acme Casino ▾]   AI: 47/100   James O.
```

При `429 AI_LIMIT_EXCEEDED` — toast-уведомление с кнопкой "Upgrade plan".

---

## Структура новых файлов

```
src/
├── db/
│   ├── client.ts                    # Neon/pg клиент (singleton)
│   └── migrations/
│       └── 001_initial.sql          # Полная схема (users, workspaces, members,
│                                    #   campaigns, invites, ai_usage)
├── domain/
│   └── auth/
│       ├── hashPassword.ts          # bcrypt hash + verify
│       └── jwt.ts                   # sign + verify JWT
├── controllers/
│   ├── auth.controller.ts           # register, login, logout, me (+ aiUsage)
│   └── workspace.controller.ts      # CRUD + invite + join
├── routes/
│   ├── auth.routes.ts               # /api/auth/*
│   └── workspace.routes.ts          # /api/workspaces/*
├── middleware/
│   ├── requireAuth.ts               # JWT cookie → req.user
│   ├── requireWorkspaceMember.ts    # role check (viewer/member/admin/owner)
│   ├── checkAiLimit.ts              # ← новый: AI-вызовы лимит + инкремент
│   └── checkWorkspaceLimit.ts       # ← новый: workspace count лимит
└── validation/
    ├── auth.schema.ts               # RegisterSchema, LoginSchema
    └── workspace.schema.ts          # CreateWorkspaceSchema, InviteSchema
```

**Новые npm-зависимости:**
```
pg                       # PostgreSQL клиент
@neondatabase/serverless  # Neon serverless adapter (для Vercel)
bcrypt                   # хэширование паролей
jsonwebtoken             # JWT sign/verify
cookie-parser            # парсинг httpOnly cookie в Express
```

---

## Изменения в существующем коде

### `src/server/app.ts`
- Добавить `cookie-parser` middleware
- Подключить `auth.routes` и `workspace.routes`
- CSP: добавить `credentials: 'include'` для fetch

### Существующие routes (`generate`, `campaign`, `tournament`)
- Обернуть в `requireAuth` middleware
- Кампании из localStorage мигрируют → `/api/workspaces/:id/campaigns`
- Все существующие AI-endpoints остаются без изменений

### `public/configurator.html` + `public/app.js`
- `savedCampaigns` из localStorage → API calls
- Добавить workspace context header `X-Workspace-Id` ко всем fetch
- При `401` — редирект на `/login`

### `public/campaign-generator.html`
- Аналогично: сохранение → API, `X-Workspace-Id` header

---

## Новые UI-страницы

### `/login` (новый файл: `public/login.html`)
```
┌─────────────────────────────────┐
│  🎰 Bonus Engine                │
│                                 │
│  Email ________________________ │
│  Password _____________________ │
│                                 │
│  [   Sign In   ]                │
│  Don't have an account? Sign up │
└─────────────────────────────────┘
```

### `/register` (новый файл: `public/register.html`)
```
┌─────────────────────────────────┐
│  Create your account            │
│                                 │
│  Name __________________________│
│  Email _________________________│
│  Password ______________________│
│                                 │
│  [   Create Account   ]         │
└─────────────────────────────────┘
```
*После регистрации: автоматически создаётся первый workspace, редирект на `/configurator.html`*

### Workspace Switcher (компонент в header всех SPA)
```
┌──────────────────────────────────────────────────┐
│ Bonus Engine   [🏢 Acme Casino ▾]   James O.  [↗]│
└──────────────────────────────────────────────────┘

Dropdown:
├── ✅ Acme Casino          (current)
├──    BetMax Operator
├──    MN Startup
├── ── ── ── ── ── ──
└── [+ New Client Workspace]
```

### `/settings` (новый файл: `public/settings.html`)
```
Workspace: [Acme Casino] [Rename]

Members:
┌────────────────────────────────────────────┐
│ james@consult.com    Owner                 │
│ anna@acme.com        Member    [Remove]    │
│ [+ Invite by email]                        │
└────────────────────────────────────────────┘

Danger zone:
[Delete workspace]
```

---

## Auth flow (полная схема)

```
Новый пользователь:
  GET /register → POST /api/auth/register
    → create user
    → create workspace "James's Workspace"
    → add as owner
    → sign JWT → set httpOnly cookie
    → redirect /configurator.html

Существующий пользователь:
  GET /login → POST /api/auth/login
    → verify password
    → sign JWT → set httpOnly cookie
    → redirect /configurator.html

Авторизованный запрос:
  fetch('/api/campaign/generate', {
    credentials: 'include',           // отправляет httpOnly cookie
    headers: { 'X-Workspace-Id': currentWorkspaceId }
  })
  → requireAuth middleware: decode JWT → req.user
  → (если нужно) requireWorkspaceMember: check membership

Истёкший токен:
  → 401 response
  → frontend redirect → /login
```

---

## Приглашение в workspace

```
1. Admin → POST /api/workspaces/:id/invite { email: "anna@acme.com", role: "member" }
2. Сервер создаёт запись в workspace_invites с token (uuid) и expires_at (+7 дней)
3. Отправляет email через Resend: "You're invited to Acme Casino workspace"
   Ссылка: https://bonusengine.io/join?token=<token>
4. Анна переходит по ссылке → /join → если не авторизована, редирект на /register?next=/join&token=...
5. После регистрации/логина: POST /api/workspaces/join/<token>
   → добавить в workspace_members
   → redirect /configurator.html с currentWorkspaceId = id
```

---

## Env variables (новые)

```
DATABASE_URL=postgresql://...@neon.tech/bonusengine   # Neon connection string
JWT_SECRET=<random 256-bit secret>                    # openssl rand -hex 32
JWT_EXPIRY=7d
COOKIE_DOMAIN=bonusengine.io                          # для production
```

---

## Фазы реализации

### Фаза 1 — Auth core
1. Создать Neon project, применить `001_initial.sql`
2. `src/db/client.ts` — pg singleton
3. `src/domain/auth/hashPassword.ts` — bcrypt
4. `src/domain/auth/jwt.ts` — sign/verify
5. `src/controllers/auth.controller.ts` — register, login, logout, me
6. `src/routes/auth.routes.ts`
7. `src/middleware/requireAuth.ts`
8. `public/login.html` + `public/register.html`
9. Защитить все существующие API routes через `requireAuth`

### Фаза 2 — Workspaces + лимиты
10. `workspace.controller.ts` — CRUD + invite + join
11. `src/middleware/requireWorkspaceMember.ts`
12. `src/middleware/checkWorkspaceLimit.ts` ← применить к `POST /api/workspaces`
13. `src/middleware/checkAiLimit.ts` ← применить ко всем AI-routes
14. Workspace switcher в header всех SPA + AI-счётчик `AI: 47/100`
15. `public/settings.html` — участники, план, лимиты
16. `/api/auth/me` возвращает `aiUsage` по каждому workspace

### Фаза 3 — Campaigns в БД
17. Campaigns API (`/api/workspaces/:id/campaigns`)
18. Переключить `configurator.html` + `app.js` с localStorage на API
19. Переключить `campaign-generator.html` на API
20. `X-Workspace-Id` header во всех fetch-запросах
21. Лимит 20 кампаний на free plan (проверка при `POST /campaigns`)

### Фаза 4 — Invite flow + Upgrade
22. Invite API: создание токена + email через Resend
23. `/join` страница (принятие инвайта)
24. Тест ролей: viewer читает, member сохраняет, admin удаляет
25. `POST /api/upgrade-request` — email-форма апгрейда через Resend → `NOTIFY_EMAIL`
26. Toast при `429 AI_LIMIT_EXCEEDED` + модальное окно с формой
27. `src/scripts/setPlan.ts` — admin CLI для ручного изменения плана в БД

---

## Оценка трудозатрат

| Фаза | Сложность | ~Задач |
|------|-----------|--------|
| 1 — Auth core | Medium | 9 задач |
| 2 — Workspaces + лимиты | Medium-High | 7 задач |
| 3 — Campaigns в БД | High (UI изменений много) | 5 задач |
| 4 — Invite flow | Low-Medium | 3 задачи |

**Итого:** ~24 задачи, ~4–5 дней разработки.

---

## Вопросы к уточнению перед реализацией

1. **Email верификация** — нужна ли при регистрации? Упрощает onboarding если нет, риск спам-аккаунтов если нет.
2. **Social login** — Google OAuth сейчас или в следующей итерации?
3. **Upgrade flow** — ✅ решено: кнопка "Upgrade" → email-форма (Resend → `NOTIFY_EMAIL`). Stripe/платёжный провайдер — следующая итерация.
4. **Rate limiting для auth** — добавить `authLimiter` (5 попыток/мин) на `POST /api/auth/login` поверх существующей инфраструктуры rate-limit.
