# CLAUDE.md — Retomat: Retention OS for iGaming

Complete architecture reference for Claude Code sessions. Updated: 2026-07-07 (auth Phases 2–4: server-side persistence).

---

## Session rules

**ОБЯЗАТЕЛЬНО перед любым кодингом** — запросить явное подтверждение у пользователя.

Порядок работы:
1. Проанализировать задачу, описать план (что и где будет изменено).
2. Дождаться явного "да" / "go" / "реализуй" от пользователя.
3. Только после подтверждения начинать вносить изменения в файлы.

---

## Running the app

```bash
npm start            # Express on http://localhost:3000
npm test             # vitest run (559 tests, 41 files)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src --ext .ts
npm run build        # vite build → public/dist/
```

`tsx` executes TypeScript directly — no build step needed for development.
Entry point: `server.ts` → `src/server/app.ts` → Express.

---

## Project structure

```
/
├── server.ts
├── vite.config.ts                   # Frontend build: 5 JS entry points → public/dist/
├── eslint.config.js                 # @typescript-eslint/recommended
├── .github/workflows/ci.yml         # CI: typecheck, lint, test, build, npm audit
├── src/
│   ├── server/app.ts                # Express: helmet CSP, requestId, pino-http, routes, static
│   ├── config/
│   │   ├── index.ts                 # Zod EnvSchema (fail-fast), ENV, PORT, API keys, DATABASE_URL, JWT_SECRET/EXPIRY, AI_MODEL, AI_TIMEOUT
│   │   ├── geo/                     # eu.ts, cis.ts, crypto.ts, sweep.ts, mn.ts, latam.ts (latam has per-country license blocks: bets_br/segob/coljuegos/mincetur)
│   │   ├── benchmarks/              # bonusBenchmarks.ts — recommended param ranges + regulatory caps per geo/license (see "Parameter benchmarks & explainability")
│   │   └── games/                   # catalog.json (168 games, 19 providers — manually curated, best-effort RTP/region data, NOT scraped/licensed from SlotCatalog or providers, see Games recommendations section) + catalog.ts (types + loader)
│   ├── db/
│   │   ├── client.ts                # Neon/pg Pool singleton
│   │   └── migrations/            # 001_initial (users+workspaces) · 002_saved_items · 003_admin_roles (role/status/plan/features) — applied manually via psql
│   ├── domain/
│   │   ├── auth/
│   │   │   ├── hashPassword.ts      # bcrypt hash + verify
│   │   │   └── jwt.ts               # signAuthToken/verifyAuthToken — payload { sub, name, email }
│   │   ├── shared/
│   │   │   ├── Segment.ts           # 'new'|'mid'|'vip' + isSegment()
│   │   │   ├── Region.ts            # 'eu'|'cis'|... + isRegion()
│   │   │   └── Currency.ts          # CurrencyCode type + isCurrencyCode()
│   │   ├── bonus/
│   │   │   ├── buildConfig.ts       # Pure: params → full bonus config
│   │   │   ├── recalcCosts.ts       # Pure: cfg + overrides → { costs, ratio, maxRisk }; accepts minD/maxWin per mechanic
│   │   │   ├── payout.ts            # truncNormalPayout: statistical cost model
│   │   │   └── chainModel.ts        # CHAIN_PROGRESSION = { dep2: 0.45, dep3: 0.25 }
│   │   ├── campaign/
│   │   │   ├── scenarios.ts         # GEO_CFG, LANG_NAME, SEG_DESC, SCENARIO_MSG
│   │   │   └── explanation.ts       # campaignExplanation(), campaignAlternatives()
│   │   ├── tournament/
│   │   │   ├── calcEconomics.ts     # calcTournamentEconomics() — SEGMENT_RATIO × totalPlayers → eligible
│   │   │   └── benchmarks.ts        # tournamentBenchmarks() — deterministic realism checks
│   │   ├── games/                   # Shared game-recommendation engine (used by both Tournament and CRM/campaign contexts)
│   │   │   ├── recommendGames.ts    # Pure: catalog scoring → { primary, alternatives, scores, all }. type/scoring optional (omit for no mechanic gate/scoring boost — CRM use); providers? filters to connected providers. Moved here from domain/tournament/ 2026-07-07.
│   │   │   └── sections.ts          # groupGamesBySection() — buckets (non-exclusive) by slotRank/mechanic/volatility/mobile: popular, live, fast, highVolatility, mobileFriendly
│   │   ├── forecast/
│   │   │   ├── normalizeCampaign.ts # Campaign → NormalizedActivity | null (by sourceType)
│   │   │   ├── cannibalization.ts   # MECHANIC_AFFINITY, audienceOverlap, overlapDaysFactor, pairCannibalization
│   │   │   └── aggregateForecast.ts # aggregateForecast(campaigns, start, end) → Forecast
│   │   ├── analytics/
│   │   │   └── compareCampaign.ts   # Pure: ForecastSnapshot + CampaignActuals → CampaignComparison
│   │   └── ai/
│   │       └── parser.ts            # tryRepairJSON — JSON repair utility
│   ├── ai/
│   │   ├── interface.ts             # AIProvider interface + AIGenerateOpts
│   │   ├── client.ts                # getAIClient() — singleton Anthropic SDK
│   │   ├── registry.ts              # getAIProvider() / setAIProvider() — for testing
│   │   ├── service.ts               # generate() → getAIProvider().generate()
│   │   ├── parser.ts                # parseTextsResponse(), parseAuditResponse(), etc. (Zod)
│   │   ├── providers/
│   │   │   ├── anthropic.ts         # AnthropicProvider class: exp. backoff, isRetryable(), cost logging
│   │   │   └── mock.ts              # MockAIProvider for tests
│   │   └── prompts/
│   │       ├── texts.prompt.ts      # buildTextsPrompt()
│   │       ├── audit.prompt.ts      # buildAuditPrompt() + per-license rule blocks
│   │       ├── optimize.prompt.ts   # buildOptimizePrompt()
│   │       ├── tournament-texts.prompt.ts
│   │       ├── tournament-audit.prompt.ts
│   │       └── tournament-optimize.prompt.ts  # buildTournamentOptimizePrompt() — realism + recs
│   ├── use-cases/
│   │   ├── Auth.ts                  # registerUser(db,input)/loginUser(db,input)/getUserById(db,id) — DB injected as first arg
│   │   ├── GenerateBonusConfig.ts   # generateBonusConfig(), recalcBonusConfig()
│   │   ├── GenerateCampaign.ts      # generateCampaign(), texts, audit, optimize (inject AIProvider)
│   │   ├── GenerateTournament.ts    # generateTournament(), texts, audit, optimize (inject AIProvider); recommendTournamentGames() — tournament-specific (type/scoring gate + AI rationale)
│   │   ├── GenerateLoyalty.ts       # generateLoyaltyConfig(), recalcLoyaltyConfig(), auditLoyalty(), optimizeLoyalty(), generateLoyaltyMissions()
│   │   └── GenerateGameRecommendations.ts # recommendGamesForContext() — deterministic, no-AI CRM game picks (bonus/campaign/loyalty): region+segment+providers → sections. No mechanic gate (unlike recommendTournamentGames).
│   ├── controllers/                 # All use createXxxController(deps) factory pattern
│   │   ├── auth.controller.ts       # createAuthController({ db }) — register, login, logout, me; sets/clears httpOnly cookie
│   │   ├── generate.controller.ts   # createGenerateController()
│   │   ├── campaign.controller.ts   # createCampaignController({ ai })
│   │   ├── tournament.controller.ts # createTournamentController({ ai })
│   │   ├── loyalty.controller.ts    # createLoyaltyController({ ai }) — generate, recalc, texts, audit, optimize, missions
│   │   ├── analytics.controller.ts  # createAnalyticsController() — analyze, saveActuals, explain
│   │   ├── games.controller.ts      # createGamesController() — recommend (no AI deps, deterministic)
│   │   └── signup.controller.ts     # createSignupController()
│   ├── services/
│   │   ├── bonus.service.ts         # generate(), recalc() — thin wrappers
│   │   ├── campaign.service.ts      # generateCampaign() — geo+scenario → config+explanations
│   │   ├── tournament.service.ts    # generateTournament() — type+params → spec+econ
│   │   ├── loyalty.service.ts       # generate() → buildLoyaltyConfig + calcLoyaltyEconomics
│   │   └── analytics.service.ts     # compareCampaign() thin wrapper
│   ├── routes/                      # Wire deps at startup: createXxxController({ ai: getAIProvider() })
│   │   ├── auth.routes.ts           # /api/auth/register + /login (authLimiter) + /logout + /me (requireAuth)
│   │   ├── generate.routes.ts
│   │   ├── campaign.routes.ts
│   │   ├── tournament.routes.ts
│   │   ├── loyalty.routes.ts        # POST /api/loyalty/generate + /recalc + /texts + /audit + /optimize + /missions
│   │   ├── games.routes.ts          # POST /api/games/recommend (apiLimiter — no AI call, cheap)
│   │   ├── signup.routes.ts
│   │   └── health.routes.ts
│   ├── middleware/
│   │   ├── asyncHandler.ts          # asyncHandler<P,R,B>(fn) — eliminates try/catch in controllers
│   │   ├── requestId.ts             # x-request-id on every response; augments Express.Request
│   │   ├── rateLimiter.ts           # apiLimiter 30/min, campaignLimiter 20/min, aiLimiter 15/min, authLimiter 5/min
│   │   ├── authCookie.ts            # resolveUser(req) — shared core: decode `_bt` cookie → user, or undefined. requireAuth/optionalAuth both call this instead of duplicating cookie/JWT logic.
│   │   ├── requireAuth.ts           # resolveUser(req) → req.user; 401 UNAUTHENTICATED if undefined. Used only by /api/auth/me. Re-exports AUTH_COOKIE from authCookie.ts.
│   │   ├── optionalAuth.ts          # resolveUser(req) → req.user (may be undefined) — never rejects, guest continues. Used by all tool routes (generate/campaign/tournament/loyalty/reports).
│   │   ├── validate.ts              # validate(schema) — Zod parse, throws ValidationError
│   │   └── errors.ts                # errorMiddleware — AppError/ValidationError/AIProviderError → HTTP
│   ├── validation/                  # All schemas export z.infer<> types
│   │   ├── auth.schema.ts           # RegisterSchema + LoginSchema — email is trim().toLowerCase()'d before .email() so register/login key off the same normalized address (users.email UNIQUE is case-sensitive)
│   │   ├── generate.schema.ts       # GenerateSchema + GenerateInput
│   │   ├── recalc.schema.ts         # RecalcSchema + RecalcInput
│   │   ├── campaign.schema.ts       # CampaignGenerateSchema + CampaignGenerateInput
│   │   ├── texts.schema.ts          # TextsSchema + TextsInput
│   │   ├── audit.schema.ts          # AuditSchema + AuditInput
│   │   ├── optimize.schema.ts       # OptimizeSchema + OptimizeInput
│   │   ├── tournament.schema.ts     # TournamentGenerateSchema + Input types (Generate/Texts/Audit/Optimize)
│   │   ├── loyalty.schema.ts        # LoyaltyGenerateSchema + LoyaltyRecalcSchema + LoyaltyMissionsSchema + Input types
│   │   ├── analysis.schema.ts       # AnalysisSchema + ActualsSchema + ExplainSchema + Input types
│   │   ├── games.schema.ts          # GamesRecommendSchema { geo, segment, providers?, plat?, uiLang? } + GamesRecommendInput
│   │   └── signup.schema.ts         # SignupSchema + SignupInput
│   └── errors/
│       ├── AppError.ts              # Base error with status + isOperational
│       ├── ValidationError.ts       # 400
│       └── AIProviderError.ts       # 502
├── public/                          # Static files served by Express
│   ├── login.html / login.js        # POST /api/auth/login; redirects to /retention-calendar.html on success. Reachable via
│   │                                 # nav/direct link only — nothing on the site force-redirects here (see Security below).
│   ├── register.html / register.js  # POST /api/auth/register
│   ├── auth-form.js                 # Shared login/register form logic (i18n bootstrap + submit/fetch/error handling) —
│   │                                 # login.js/register.js are thin `initAuthForm({...})` configs, loaded as `type="module"`.
│   │                                 # Shared `.auth-*` CSS lives in styles.css, not inline per-page.
│   ├── index.html                   # Landing — Retention OS positioning (EN/RU), calendar-first
│   ├── index.js                     # Landing i18n (EN/RU) + particles + sticky CTA
│   ├── styles.css                   # Configurator shared CSS
│   ├── app.js                       # Legacy Bonus Configurator logic (superseded by configurator.js for the unified tool)
│   ├── nav-utils.js                 # Shared across all pages: updateAllBadges(), applyNavLang(), initNavSubgroups()
│   ├── balance-solver.js            # solveToTarget() — generic parameter solver for Balance-to-Profit
│   ├── bonus-cost.js                # Client-side bonus cost model (parity with backend recalcCosts); supports minD/maxWin overrides
│   ├── bonus-benchmarks.js          # Client mirror of src/config/benchmarks/bonusBenchmarks.ts — param benchmark bands + regulatory notes (window.RetomatBenchmarks)
│   ├── loyalty-econ.js              # Client-side loyalty economics (parity with backend calcLoyaltyEconomics)
│   ├── tournament-econ.js           # Client-side tournament economics (parity with backend calcTournamentEconomics)
│   ├── forecast.js                  # Client-side port of src/domain/forecast/ — normalizeCampaign, aggregateForecast, MECHANIC_AFFINITY
│   ├── configurator.html            # Unified Promo Configurator SPA — Bonus / Tournament / Loyalty in one page
│   ├── configurator.js              # Unified configurator logic — CS state, cfgRender(), all 3 promo types, AI tabs
│   ├── configurator-extra.js        # Legacy — no longer loaded by configurator.html (dead code)
│   ├── campaign-generator.html      # AI Campaign Generator SPA
│   ├── campaign-generator.js        # Campaign Generator logic — i18n via setUILang() + data-i18n attrs
│   ├── tournament-generator.html    # Tournament Generator SPA
│   ├── tournament-generator.js      # Tournament Generator — TG dict + tg() i18n, balance-solver, tournament-econ
│   ├── loyalty-generator.html       # Loyalty Generator SPA
│   ├── loyalty-generator.js         # Loyalty Generator — L dict + t() i18n, loyalty-econ, balance-solver
│   ├── retention-calendar.html      # Retention Calendar SPA — dark theme; loads nav-utils.js + RC bundle
│   ├── retention-calendar.js        # RC entry point — imports FullCalendar modules, init
│   ├── retention-calendar/          # RC module files (calendar, store, repo, i18n, conflicts, export…)
│   │   ├── calendar.js              # initCalendar() — FullCalendar wrapper; buttonText: prev ‹ / next › / today localised
│   │   ├── store.js                 # Reactive state: campaigns, templates, filters, view
│   │   ├── repository.js            # Async localStorage: listCampaigns, saveCampaign, etc.
│   │   ├── types.js                 # JSDoc types, TYPE_COLORS, CAMPAIGN_TYPES, SEGMENTS
│   │   ├── conflicts.js             # detectConflicts(), datesOverlap()
│   │   ├── export.js                # toCSV(), toJSON(), exportCSV(), exportJSON()
│   │   ├── filters.js               # applyFilters(), toggleFilter(), clearFilters()
│   │   ├── templates.js             # saveAsTemplate(), createFromTemplate(), duplicateCampaign()
│   │   ├── ai-to-campaign.js        # campaignFromAI(), tournamentFromAI()
│   │   ├── forecast-panel.js        # initForecastPanel(), refreshForecast(), toggleForecastPanel() — imports ../forecast.js
│   │   └── i18n.js                  # getT() → RU/EN string map
│   ├── generator.html               # Unified Generator hub — Bonus / Tournament / Loyalty tabs in one page (forked from campaign-generator.html)
│   ├── generator.js                 # Bonus tab logic — fork of campaign-generator.js + genSwitchType()/genSetLang()/genToggleGlossary() orchestration
│   ├── generator-tournament.js      # Tournament tab logic — fork of tournament-generator.js, colliding globals prefixed tg* (e.g. tgDraft, tgShowView)
│   ├── generator-loyalty.js         # Loyalty tab logic — fork of loyalty-generator.js, colliding globals prefixed ly* (e.g. lyDraft, lyShowView)
│   ├── privacy.html                 # Privacy Policy (EN/RU)
│   └── terms.html                   # Terms of Service (EN/RU)
│   └── dist/                        # Vite output (gitignored except retention-calendar.js)
│       └── retention-calendar.js    # Committed bundle — FullCalendar can't be served as bare ESM
└── tests/
    ├── domain/buildConfig.test.js
    ├── domain/recalcCosts.test.js
    ├── domain/calcEconomics.test.js              # 25 tests (totalPlayers/segmentRatio coverage)
    ├── domain/payout.test.js
    ├── domain/benchmarks.test.js                 # Tournament benchmarks tests
    ├── domain/retention.conflicts.test.js        # 9 tests
    ├── domain/retention.export.test.js           # 8 tests
    ├── domain/retention.repository.test.js       # 10 tests
    ├── domain/retention.mapper.test.js           # 10 tests
    ├── ai/parser.test.js
    ├── domain/loyalty.buildConfig.test.js        # 20 tests
    ├── domain/loyalty.calcEconomics.test.js      # 24 tests
    ├── domain/loyalty.solver.test.js             # loyalty balance-solver parity tests
    ├── domain/loyalty.econ.parity.test.js        # loyalty-econ.js ↔ backend parity
    ├── domain/loyalty.missionLink.parity.test.js # loyalty-missions-link.js ↔ backend linkMissions.ts
    ├── domain/loyalty.persistence.test.js        # link round-trip, narrative merge by id, updateProgramMissions, legacy snapshots
    ├── domain/tournament.balance.test.js         # tournament balance-solver tests
    ├── domain/tournament.econ.parity.test.js     # tournament-econ.js ↔ backend parity
    ├── domain/balance.solver.test.js             # balance-solver.js unit tests
    ├── domain/bonus.cost.parity.test.js          # bonus-cost.js ↔ backend recalcCosts parity
    ├── domain/bonus.parseRecTarget.test.js       # parseRecTarget() edge cases
    ├── domain/bonus.solver.constraints.test.js   # solver constraint bounds tests
    ├── domain/bonus.chain.test.js                # chain cohort sums, chainCostRatio, edge cases (pl=0, dep=0)
    ├── domain/forecast.normalize.test.js         # normalizeCampaign: tournament/campaign/loyalty/null inputs
    ├── domain/forecast.cannibalization.test.js   # matrix symmetry, audienceOverlap, overlapDaysFactor, pairLoss
    ├── domain/forecast.aggregate.test.js         # 0/1/N activities, byDay integrity, pairs ordering
    ├── domain/forecast.parity.test.js            # forecast.js ↔ backend identical Forecast for same inputs
    ├── domain/recommendGames.test.js             # scoring determinism, type gating (live/slot), geo/segment rules, optional type/scoring, providers filter
    ├── domain/games.sections.test.js             # groupGamesBySection bucket correctness, non-exclusive buckets
    ├── domain/compareCampaign.test.js            # percentile bands, flags, currency separation, division-by-zero
    └── integration/
        ├── api.generate.test.js
        ├── api.loyalty.test.js                   # 11 tests
        ├── api.loyalty.missions.test.js          # MockAIProvider fixture, id match, graceful missing ids
        ├── api.tournament.games.test.js
        ├── api.tournament.optimize.test.js
        ├── api.games.test.js                     # POST /api/games/recommend — sections, providers filter, validation
        └── security.headers.test.js              # CSP assertions
```

---

## Backend architecture patterns

### asyncHandler — `src/middleware/asyncHandler.ts`

Eliminates try/catch boilerplate. All controllers use it:
```typescript
export const generate = asyncHandler<{}, {}, GenerateInput>(async (req, res) => {
  res.json({ cfg: generateBonusConfig(req.body) });
});
```

### Factory injection — controller pattern

All controllers are factory functions to enable dep injection in tests:
```typescript
export function createCampaignController({ ai }: { ai: AIProvider }) { ... }
// Routes wire deps at startup:
const ctrl = createCampaignController({ ai: getAIProvider() });
```
In tests: `createCampaignController({ ai: new MockAIProvider([...]) })`.

### AI provider registry — `src/ai/registry.ts`

```typescript
getAIProvider()          // returns AnthropicProvider singleton
setAIProvider(mock)      // override in tests
```

### Config validation — `src/config/index.ts`

Zod `EnvSchema` runs at startup. If `ANTHROPIC_API_KEY` or `RESEND_API_KEY` is missing/malformed, the process exits with a clear error message before serving any requests.

### AI retry — `src/ai/providers/anthropic.ts`

Exponential backoff with full jitter. Only retryable errors (429, 5xx, network) trigger retry; 400 errors do not. Logs `cost_usd` per call (Haiku pricing: $0.80/M input, $4.00/M output).

---

## API routes

`/api/auth/me` requires a logged-in session (`requireAuth`); `/api/admin/*` requires an admin (`requireAdmin`). The tool routes — `/api/generate`, `/api/campaign/*`, `/api/tournament/*`, `/api/loyalty/*`, `/api/reports/*`, `/api/games/*` — use `optionalAuth` (attaches `req.user` when a valid `_bt` cookie is present, never rejects anonymous) **plus `requireFeature(x)`**, which gates each on the caller's effective feature access (see **Admin & feature access** below). Guests get `GUEST_FEATURES` (bonus/campaign/tournament/games open; loyalty/reports/calendar → 403); registered users get `plan ⊕ per-user overrides`. `/api/health`, `/api/signup`, and `/api/features` (the effective-feature probe the frontend gates UI on) are unauthenticated. See `src/server/app.ts` for the mount order.

| Method | Path | Limiter | Schema | Handler |
|--------|------|---------|--------|---------|
| POST | `/api/auth/register` | authLimiter 5/min | RegisterSchema | `createAuthController().register` — creates user + workspace, sets cookie |
| POST | `/api/auth/login` | authLimiter 5/min | LoginSchema | `createAuthController().login` — verifies password, sets cookie |
| POST | `/api/auth/logout` | — | — | `createAuthController().logout` — clears cookie |
| GET | `/api/auth/me` | — | — (requireAuth) | `createAuthController().me` — returns `{ user{id,name,email,role}, features }` |
| GET | `/api/features` | — | — (optionalAuth) | `createAccessController().features` — `{ authenticated, role, plan, features }` effective for caller (guest or user) |
| GET | `/api/admin/meta` | 30/min + requireAdmin | — | `createAdminController().meta` — `{ features, plans, presets }` for the admin UI |
| GET | `/api/admin/users` | 30/min + requireAdmin | AdminListQuerySchema (query) | `.list` — `?q=&limit=&offset=` |
| GET | `/api/admin/users/:id` | ↑ | — | `.get` |
| PATCH | `/api/admin/users/:id` | ↑ | AdminUpdateUserSchema | `.update` — role/status/plan/features; self- & last-admin guards |
| DELETE | `/api/admin/users/:id` | ↑ | — | `.remove` — cascades workspace; self- & last-admin guards |
| POST | `/api/generate` | 30/min | GenerateSchema | `createGenerateController().generate` |
| POST | `/api/recalc` | 30/min | RecalcSchema | `createGenerateController().recalc` |
| POST | `/api/campaign/generate` | 20/min | CampaignGenerateSchema | `createCampaignController().generate` |
| POST | `/api/campaign/texts` | 15/min | TextsSchema | `createCampaignController().texts` |
| POST | `/api/campaign/audit` | 15/min | AuditSchema | `createCampaignController().audit` |
| POST | `/api/campaign/optimize` | 15/min | OptimizeSchema | `createCampaignController().optimize` |
| POST | `/api/tournament/generate` | 20/min | TournamentGenerateSchema | `createTournamentController().generate` |
| POST | `/api/tournament/texts` | 15/min | TournamentTextsSchema | `createTournamentController().texts` |
| POST | `/api/tournament/audit` | 15/min | TournamentAuditSchema | `createTournamentController().audit` |
| POST | `/api/tournament/games` | 15/min | TournamentGamesSchema | `createTournamentController().games` |
| POST | `/api/tournament/optimize` | 15/min | TournamentOptimizeSchema | `createTournamentController().optimize` |
| POST | `/api/loyalty/generate` | 20/min | LoyaltyGenerateSchema | `createLoyaltyController().generate` |
| POST | `/api/loyalty/recalc` | 30/min | LoyaltyRecalcSchema | `createLoyaltyController().recalc` |
| POST | `/api/loyalty/texts` | 15/min | LoyaltyTextsSchema | `createLoyaltyController().texts` |
| POST | `/api/loyalty/audit` | 15/min | LoyaltyAuditSchema | `createLoyaltyController().audit` |
| POST | `/api/loyalty/optimize` | 15/min | LoyaltyOptimizeSchema | `createLoyaltyController().optimize` |
| POST | `/api/loyalty/missions` | 15/min | LoyaltyMissionsSchema | `createLoyaltyController().missions` |
| POST | `/api/games/recommend` | 30/min (apiLimiter) | GamesRecommendSchema | `createGamesController().recommend` — deterministic, no AI call |
| GET/POST | `/api/saved/:entity` | 30/min (apiLimiter) + requireAuth + requireWorkspace | SaveItemSchema (POST) | `createSavedItemsController().list/save` — upsert by client id |
| DELETE | `/api/saved/:entity/:id` | ↑ | — | `.remove` — delete by client id. entity ∈ configs\|campaigns\|tournaments\|loyalty-programs\|calendar-events\|calendar-templates |
| POST | `/api/campaign/actuals` | 30/min | ActualsSchema | `createAnalyticsController().saveActuals` |
| POST | `/api/campaign/analysis` | 30/min | AnalysisSchema | `createAnalyticsController().analyze` |
| POST | `/api/campaign/analysis/explain` | 15/min | ExplainSchema | `createAnalyticsController().explain` |
| POST | `/api/signup` | 5/hr | SignupSchema | `createSignupController().signup` |
| GET | `/api/health` | — | — | `{ status: 'ok' }` |
| GET | `/privacy` | — | — | `public/privacy.html` |
| GET | `/terms` | — | — | `public/terms.html` |
| GET | `/generator.html` | — | — | `public/generator.html` — unified Generator hub (Bonus/Tournament/Loyalty tabs), served as a static file |

---

## Core business logic

### `buildConfig(params)` — `src/domain/bonus/buildConfig.ts`

Pure function. Input: `{ region, lic, sitecur, depcur, players, avgdep, plat, rtp, riskAdj }`.

Returns full bonus config: `{ welcome, ndb, reload, dep2, dep3, wager, cashback, contrib, fsSpec, econ, reg, cur, r, pl, dep, lic }`.

**License override pattern** — `geo.licenses[lic]` values override base geo defaults per section.

Active licenses: `mga` (EU default), `ukgc` (UK), `dga` (Denmark), `none` (CIS/latam/sweep/mn).

**CIS note** — `reload.maxBMax` is `Infinity`; ceiling enforced via `maxBMulti: 1.5` (1.5× avgdep).

**Payout fallback** — `truncNormalPayout` underflows for large-denomination currencies (RUB/KZT/MNT). Fix: if `payoutStat < bonusSize × 1e-6`, use deterministic breakeven-efficiency estimate instead.

### `computeSelectedEcon(cfg, selectedTypes)` — `src/domain/bonus/selectedEcon.ts`

Pure. Aggregates expected cost across the **actually-selected** bonuses so the Campaign Generator economics react to adding/removing any bonus (welcome, ndb, dep2, dep3, reload, cashback). `campaign.service.ts` calls it with `effectiveTypes` and merges the result into the returned `econ` (overrides `sP10/sP50/sP90.cost`, `costRatio`, `maxRisk`; adds `breakdown[]`, `selectedTypes`). `buildConfig` itself is **not** changed (Configurator + snapshots unaffected). Frontend gates the deposit-chain block on `selectedTypes` containing both dep2 and dep3.

Per-mechanic cost: `payout(bSize, wx, adjWCR_s, adjRTP_s) × cohort_s × pl`, scenarios P10/P50/P90 with the same WCR/RTP deltas as `buildConfig.calcScenario`. Cohorts (calibrated 2026-06-03): welcome `conv_s`; ndb 0.40; dep2 `conv_s×0.45`; dep3 `conv_s×0.25`; reload 0.10; cashback `cbPct × dep×(1−mixedRTP) × 0.30 × cbScale{0.5/1.0/1.6}`. Tier-cashback `pct` parsed from "5%" strings. Client mirror: `public/bonus-selected-econ.js` (parity test `bonus.selectedEcon.parity.test.js`).

### `recalcCosts(cfg, overrides)` — `src/domain/bonus/recalcCosts.ts`

Returns `{ costs: { w_p10, w_p50, w_p90, ndb, rl, d2, d3, fs, total }, ratio, maxRisk }`.
All cost values are TOTAL (already multiplied by `pl`). `ratio = w_p50 / (pl × dep)`.

**`minD` / `maxWin` overrides** — each mechanic accepts per-call overrides for minimum deposit and max win cap. Passed as `overrides.w_minD`, `overrides.w_maxWin`, `overrides.d2_minD`, etc. Used by the unified configurator to reflect user-edited field values without a full `buildConfig` round-trip.

### `calcTournamentEconomics()` — `src/domain/tournament/calcEconomics.ts`

```typescript
eligible = round(totalPlayers × SEGMENT_RATIO[segment])
SEGMENT_RATIO: { all:1.0, new:0.20, vip:0.10, dormant:0.40, depositors:0.60 }
ENGAGEMENT_LIFT: { flash:1.40, daily:1.50, weekly:1.80, monthly:2.20, multi_round:2.00 }
PARTICIPATION_RATES: { weekly: { low:0.06, mid:0.11, high:0.20 }, … }
```

ROI calibrated to market benchmarks (200% realistic range). Revised 2026-05 to fix over-optimistic projections.

### `econ` object (inside buildConfig output)

Key fields: `arpu` (USD/mo), `cac` (USD), `bpct`, `ltv3`, `mBudget`, `roi3`, `be`, `wagerX`, `costRatio`, `breakeven_wager`, `bonusSize`, `sP10/sP50/sP90`, `mixedRTP`, `mixedWCR`, `pl`, `dep`.

- `arpu`, `cac`, `ltv3`, `mBudget` — **USD** benchmarks
- `dep`, `sP{n}.cost`, `bonusSize` — **sitecur** (local currency)

**`econ.chain`** — present when `dep2`/`dep3` mechanics are active. Deposit-funnel aggregate using `CHAIN_PROGRESSION = { dep2: 0.45, dep3: 0.25 }` (fraction of welcome cohort reaching each step):

```
chain: {
  steps: [{ key, bonusSize, cohort, cost }, …],  // welcome/dep2/dep3
  chainCost,       // Σ cost × cohort × pl
  chainCostRatio,  // chainCost / (pl × dep)
  chainMaxRisk,    // Σ bonusSize × cohort × pl
}
```

Single-step fields (`costRatio`, `sP50`, etc.) are preserved for backward compat. `campaign.service.ts` exposes `isChain` + `primaryCostRatio` (chainCostRatio when chain, costRatio otherwise).

---

## Geo config — `src/config/geo/`

| Region | File | Countries |
|---|---|---|
| `eu` | `eu.ts` | DE, DK, FR, ES, IT, NL, UK |
| `cis` | `cis.ts` | RU, KZ |
| `crypto` | `crypto.ts` | Global crypto |
| `sweep` | `sweep.ts` | US sweepstakes |
| `mn` | `mn.ts` | Mongolia |
| `latam` | `latam.ts` | MX, BR |

Country → geo/license (`GEO_CFG` in `src/domain/campaign/scenarios.ts`):
```
de/fr/es/it/nl → eu, mga, EUR    dk → eu, dga, DKK    uk → eu, ukgc, GBP
ru → cis, none, RUB    kz → cis, none, KZT    mn → mn, none, MNT
us → sweep, none, USD
LatAm (all sitecur=USD in backend — see currency-layer note below):
  br → latam, bets_br    mx → latam, segob    co → latam, coljuegos
  pe → latam, mincetur   ar → latam, none     cl → latam, none
```

**LatAm split (2026-07-19)** — LatAm broken into 6 countries mirroring EU's per-country model. `latam.ts` now has a `licenses:{}` block (like EU's `ukgc`/`dga`): regulated markets carry their own license (`bets_br` Brazil/SPA, `segob` Mexico, `coljuegos` Colombia, `mincetur` Peru — each with `reg` strings + welcome/wager overrides, **all amounts in USD**); Argentina (provincial) and Chile (grey market) use the offshore Curaçao default (`none`). New license keys added to the `lic` enums in `generate`/`campaign`/`tournament` schemas + `reg_*` i18n in `app.js` (4 langs). Backend computes **all LatAm in USD** — a single shared `LATAM` geo object can't hold 6 currency scales (BRL ×5.5 … COP ×4100), so local currency is a **display layer**, never a backend re-scale.

**Currency layer (display-only, `public/geo-data.js`)** — single source of truth for the geo list (replaces the ~6 duplicated dicts). Each geo has `cur` (backend currency, sent as sitecur — LatAm=USD), `rate` (units of cur/USD), `local`+`localRate` (region display currency). A currency toggle in the unified Configurator (Bonus/Tournament/Loyalty tabs) picks the display currency — **region-local by default, USD optional** — via `GeoData.convertConfigCurrency()`/`convertCosts()` applied to the API responses at pure-render boundaries (`renderBonusResults`, `updateBonusCostDisplay`, econ tabs) and to money input fields (avgdep/prize/overrides). USD econ benchmarks (arpu/cac/ltv3) and ratios are never converted. Loyalty is currency-agnostic (always USD backend) → its factor uses base=1, not geo.rate (see `dispBaseRate()`). Loyalty tab now uses a country selector grouped by region (`cfgGeoOptions`), deriving region from the country. Standalone generators (campaign/tournament + `generator*.js` twins) got the 4 new countries added to their geo dicts (additive; no currency toggle there — the Configurator is the primary tool). Tests: `tests/domain/geo.currency.test.js` (converter + factor + list integrity), `buildConfig.test.js` (per-license LatAm snapshots).

---

## AI subsystem

**Model:** `claude-haiku-4-5-20251001` (constant `AI_MODEL` in `src/config/index.ts`)

**Token budgets:** texts → 4096, audit → 900, optimize → 1000, tournament/optimize → 1200

**Retry:** exp backoff + full jitter, max 2 retries; only 429/5xx/network errors retried.

**Cost logging:** `cost_usd` logged per call (input × $0.80/M + output × $4.00/M).

**Audit `rule` field:** each audit check includes a `rule` string citing the specific regulation. Field is optional in schema for backward compat.

**Response schemas** (`src/ai/parser.ts`):
- `TextsResponseSchema`: `{ push[3], email[3]{subject,body}, sms[3], telegram[3], popup[3]{headline,subtext,cta} }`
- `AuditResponseSchema`: `{ checks[5]{label,status,note,rule?}, recommendations[2-4]{text,impact} }`
- `OptimizeResponseSchema`: `{ recommendations[1-5]{factor,param,current,target,reason,impact} }`
- `TournamentOptimizeResponseSchema`: `{ realism:{verdict,summary,checks[3-6]{metric,forecast,benchmark,verdict,note}}, recommendations[1-3]{param,current,target,reason,impact} }`
- `LoyaltyMissionsResponseSchema`: `{ missions[]{id, narrative, tierEffect?} }` — **id only, no name**; join with `config.missions` by id to get name/objective/reward

---

## Frontend

### CSP policy (`src/server/app.ts`)

- `scriptSrc: ["'self'"]` — all JS is in external files; `'unsafe-inline'` removed
- `scriptSrcAttr: ["'unsafe-inline'"]` — needed for `onclick=` handlers until converted to `addEventListener`
- `styleSrc: ["'self'", "'unsafe-inline'"]` — FullCalendar injects inline styles

### Landing page — `public/index.html` + `public/index.js`

**Positioning:** Retention OS for iGaming — calendar-first workspace narrative.

**Hero visual:** Fake-realistic weekly Retention Calendar grid (Mon–Fri, 5 colored campaign events, overlap warning).

**Section order:** Hero → Tools hub → Marquee → CRM Chaos → Retention Calendar feature → How it works → Features → Examples → Regions → Licenses → Econ → Audience → Demo → Signup.

**CTAs:** Primary → `/retention-calendar.html`; Generators → secondary (btn-outline).

**i18n:** EN/RU via `data-i18n` attributes resolved by `index.js`. Both locales must be updated on any text change.

**Nav:** Calendar · Bonuses (→ /configurator.html) · Tournaments · Try Retomat Free (gold).

### `public/configurator.html` + `public/configurator.js` — Unified Promo Configurator

Single-page configurator for all three promo types: **Bonus**, **Tournament**, **Loyalty**. Switched via top type tabs. No build step — pure vanilla JS.

**State model:**
```javascript
CS = {
  type: 'bonus'|'tournament'|'loyalty',  // localStorage: cfg_type
  bonus:      { geo, players, segment, plat, rtp, active, ov, config, costs },
  tournament: { type, geo, segment, totalPlayers, duration, prizePool, poolModel,
                distribution, entryModel, scoring, reentry, rake, result },
  loyalty:    { mode, region, segment, players, avgdep, arpu, numTiers,
                topCashbackRate, earnRateDeposit, earnRateWager, redeemRate,
                redeemMinPoints, pointsExpiry, missionCount, result },
}
CAI = { bonus, tournament, loyalty }  // per-type AI tab state: { tab, audit, optimize, … }
```

**Render loop:** `cfgRender()` → `renderMainContent()` → `renderBonusSection()` / `renderTournamentSection()` / `renderLoyaltySection()` → innerHTML of `#content`.

**Override values (`B.ov`):** NEVER overwritten from API. User-edited fields always take precedence. `B.ov` is populated with sensible defaults at page load and only mutated by direct user input.

**Bonus recalc flow:**
1. `onGenerateBonus()` → `POST /api/generate` → sets `B.config`, then calls `runBonusRecalc()`
2. `runBonusRecalc()` → `POST /api/recalc` (with `B.ov` overrides) → `updateBonusCostDisplay(data, cfg)`
3. `updateBonusCostDisplay()` patches cost/risk/ROI/LTV DOM elements in place (no full re-render); also refreshes Economics tab if open

**Bonus Economics tab (`CAI.bonus.tab === 'econ'`):** Renders V2 retention lift model. Structure:

- **6 econ-grid cards** (top row, always visible after Generate): P50 Cost · Cost/Deposits · Max Risk (P90) · ARPU · LTV 3 mo · **ROI Платформы** (`E.roi3` from buildConfig — LTV3/CAC benchmark, NOT recalculated from bonus cost)
- **4 econ-card-sm** inside `bonus-ai-content` (econ tab): P50 Cost (3mo) · LTV 3 mo · **ROI Бонуса** (campRoi = incrRev/campCost3) · Net Result
- **First-principles breakdown table** (`renderBonusBreakdownTable`): "На игрока" block (bonusSize, B×WR, GGR/player, payout/player, net/player) + "На кампанию" block (pl, active, totalGgr, totalPaid, netCampaign) — 3 columns by conv scenario (10/20/40%). Values in sitecur.
- **Scenario table**: Лучший/Базовый/Худший with colored dot indicators and `grid-template-columns` for column alignment
- **Factor table**: Base Segment row + F1–F5 rows, each in 3-column CSS grid (`1fr 110px 58px`), formula tooltip on Retention Lift row, ℹ tooltip on section header

**ROI naming distinction (critical):** "ROI Платформы" = `E.roi3` (buildConfig geo benchmark, `(LTV3/CAC - 1) × 100`). "ROI Бонуса" = `campRoi` (incremental revenue model: `(incrRev - campCost3) / campCost3 × 100`). These are different metrics — never conflate them.

**`computeBonusLift(B)`** helper — computes V2 lift object `{ wagFactor, genFactor, mechFactor, rtpFactor, platFactor, base, lift, wagerX, beW, matchPct, rtp, plat, … }` and `economics { net, campCost3, incrRev, incrPl, pl }`. Used by Audit and Optimize API calls, also by the Econ tab render.

**`computeBonusBreakdown({ bonusSize, wagerX, rtp, pl, conv })`** — first-principles per-player and per-campaign breakdown. Returns `{ ggrPerWager, payoutPerPlayer, netPerPlayer, activePlayers, totalGgr, totalPayout, netCampaign }`. When `WR × (1 − RTP) > 1` (wager exceeds breakeven), `payoutPerPlayer = 0` and `netPerPlayer > 0` (casino earns on wagering alone). Values in sitecur.

**Net result currency fix:** `renderBonusAiContent` holds `SITECUR_TO_USD` conversion table (USD/EUR/GBP/DKK/RUB/KZT/MNT/BTC/ETH). P10/P90 net scenario adjustments apply `fxToUsd` factor: `net10 = eco.net × (conv10/conv50) − (p10c − p50c) × 3 × fxToUsd`. This prevents mixing sitecur cost deltas with USD-denominated incrRev.

**Tournament Economics tab:** `renderTournEconContent(T)` — scenario table (Conservative/Expected/Optimistic) with participants, GGR lift, net margin + 4 metric cards (Prize Pool Cost, Retention Value, Total Value, Break-even Players).

**Loyalty Economics tab:** `renderLoyaltyEconContent(LY)` — 6 summary cards + cost breakdown table (Redemption/Tier Rewards/Mission Rewards) + Points Economy cards.

**AI endpoint payloads (critical — schema-validated):**

| Action | Endpoint | Body |
|--------|----------|------|
| Bonus audit | `POST /api/campaign/audit` | `{ mechanic: B.config, mechanicType, params: { geo, segment, lic, lang, risk }, uiLang }` |
| Bonus optimize | `POST /api/campaign/optimize` | `{ geo, segment, lift: liftObj, economics: econObj, uiLang }` |
| Tournament audit | `POST /api/tournament/audit` | `{ type, spec: T.result.spec, params: T.result.params }` |
| Tournament optimize | `POST /api/tournament/optimize` | `{ type, params: T.result.params, econ: T.result.econ, mode: 'optimize' }` |
| Loyalty audit | `POST /api/loyalty/audit` | `{ config: LY.result.config, uiLang }` |
| Loyalty optimize | `POST /api/loyalty/optimize` | `{ config: LY.result.config, econ: LY.result.econ, uiLang }` |
| Loyalty missions | `POST /api/loyalty/missions` | `{ config: LY.result.config, econ: LY.result.econ, uiLang }` |

**Legacy files (no longer active):** `app.js`, `configurator-extra.js` — not loaded by `configurator.html`. Dead code, do not edit.

### `public/configurator.html` + `public/app.js` + `public/configurator-extra.js` (LEGACY)

Legacy Bonus Configurator — superseded by the unified `configurator.js`. `app.js` = main logic (i18n RU/EN/MN/ES). `configurator-extra.js` = RTP sync, edit mode, audit panel, incremental revenue. **Not loaded by `configurator.html` anymore.**

### `public/campaign-generator.html` + `public/campaign-generator.js`

AI Campaign Generator SPA.

Key state: `draft = { scenario, _step, params }`. Key functions: `startWizard()`, `goStep(n)`, `showView(name)`.

**Step 3 Basic/Expert toggle**: `#econ-wrap[data-expert="0/1"]`, localStorage key `cg_expert_mode`.

**Add to Calendar**: `addCampaignToCalendar()` — duplicate check via `confirm()`, saves to RC localStorage.

### `public/nav-utils.js` — shared across all pages

Loaded on every page (tournament, loyalty, retention-calendar). Three responsibilities:

1. **`applyNavLang(lang)`** — translates all `[data-i18n]` elements using `_NAV_I18N` dict (EN/RU). Keys: `nav_main`, `nav_dashboard`, `nav_tools`, `nav_calendar`, `nav_bonuses`, `nav_tournament`, `nav_setup_guide`, `nav_loyalty`, `nav_soon`, `nav_analytics`, `nav_settings`, `nav_back`, plus RC-specific: `nav_rc_new`, `nav_rc_ai`, `nav_rc_templates`, `nav_rc_month`, `nav_rc_week`, `nav_rc_agenda`, `nav_rc_today`.
2. **`updateAllBadges()`** — refreshes badge counts from localStorage (`be_campaigns`, `savedTournaments`, `savedLoyaltyPrograms`).
3. **`initNavSubgroups()`** — wires collapse/expand for `.nav-chevron` → `.nav-sub` items (Tournaments submenu). State in `nav-sub-tourn-expanded` localStorage key.

**Campaign-generator** does NOT use nav-utils — it has its own `setUILang()` + i18n dict.

### `public/tournament-generator.html` + `public/tournament-generator.js`

Tournament Generator SPA.

**Views**: `showView('list')`, `showView('detail', id)`, `showView('setup')`, `goStep(1–4)`.

**i18n**: `TG` dict object (EN + RU, ~80 keys) + `tg(key, ...args)` helper. Covers all step labels, form fields, chip options, econ cards, list/detail views. `setTournLang(lang)` saves to localStorage, calls `applyNavLang(lang)`, re-renders the current view via `_tgCurrentView` state variable. Chip labels for segments/entry/scoring/duration/pool/distribution/reentry come from `tg('seg_labels')` etc. (nested objects in TG dict).

**Flash prevention**: `.main{opacity:0;transition:opacity .15s}` + JS adds `.main.ready` after init (same pattern as campaign-generator).

**Step 2:** Prize pool recommendation — `calcSuggestedPrize()` auto-sets based on GEO/segment/duration/totalPlayers (60% of projected GGR lift). Auto-set flag `_prizeAutoSet`.

**Balance to Profit**: `balanceTgToProfit(targetRoi)` uses `window._balanceSolver` (balance-solver.js) + `window._tournamentEcon` (tournament-econ.js) to solve prize pool / pool model levers. `tgActionPanelHTML()` renders the action panel with Apply Recs / Balance / Undo buttons.

**Add to Calendar**: `addTournamentToCalendar()` — duplicate check via `confirm()`.

**Save/library**: `savedTournaments` localStorage. `saveTournament()`, `deleteTournament(id)`.

### `public/loyalty-generator.html` + `public/loyalty-generator.js`

Loyalty Generator SPA.

**Views**: `showView('list')`, `showView('setup')`, `showView('detail', id)`.

**i18n**: `L` dict object (EN + RU) + `t(key, ...args)` helper. `setLang(lang)` saves to localStorage, calls `applyNavLang(lang)`, calls `render()`. All step badges, topbar labels, econ-card subtitles (`/mo`, `of GGR`, `retention`, etc.), mission `Target:`/`Reward:`, tab names (Economics/Audit/Optimize), list heading and counters use `t()`.

**Flash prevention**: `.main{opacity:0;transition:opacity .15s}` + JS adds `.main.ready` after init.

**Steps (setup flow):**
- Step 1 — Basics: mode chip (tiers/missions/hybrid), region select, segment chips, players/avgdep/arpu inputs
- Step 2 — Program Design: tier count (3/4/5), top cashback rate slider, earn rates, redeem config, mission count; live tier preview (client-side, no API)
- Step 3 — Results: API call to `/api/loyalty/generate` → economics grid (6 cards) + tier table + mission list; Save + Add to Calendar buttons; AI tabs (Economics/Audit/Optimize/Missions)

**Client-side tier preview**: `calcTiersPreview(draft)` — minPoints = thresholdMonths × avgdep × earnRateDeposit; cashback linear from 0 to topCashbackRate.

**Balance to Profit**: `balanceToProfit(targetRoi)` uses `window._loyaltyEcon` (loyalty-econ.js) + `window._balanceSolver`. Levers: earnRateDeposit, topCashbackRate, redeemRate.

**Add to Calendar**: `addLoyaltyToCalendar()` / `addDetailToCalendar(id)` — creates `type:'vip'` entry in `rc_campaigns` localStorage with `sourceType:'loyalty_generator'`.

**Save/library**: `savedLoyaltyPrograms` localStorage key.

### `public/retention-calendar.html` + `public/retention-calendar.js` + `public/retention-calendar/`

**Retention Calendar SPA** — central CRM planning hub.

**Bundle:** FullCalendar 6 requires bundling (bare npm imports not browser-resolvable). Vite builds `public/retention-calendar.js` → `public/dist/retention-calendar.js` (no hash, committed to git via `.gitignore` exception). **After any change to `retention-calendar/` source files, run `npm run build`.**

**Flash prevention**: `.main{opacity:0;transition:opacity .15s}` + `.main.ready`. Applied by inline init script after `applyNavLang()` + `updateAllBadges()`.

**i18n**: Loads `nav-utils.js` for nav/sidebar translation. All nav items have `data-i18n` attributes. View toggle buttons (Month/Week/Agenda), action buttons (AI-Assisted, Templates, New Campaign) also use `data-i18n`. FullCalendar `buttonText`: `prev:'‹'`, `next:'›'`, `today` localised from localStorage at calendar init time. `setRCLang(lang)` saves lang + `location.reload()` (module bundle reads lang on init).

**Views:** Month / Week / List (FullCalendar built-in).

**Drag & drop:** `eventDrop` + `eventResize` handlers → `upsertCampaign()`.

**Date-click popup:** clicking empty calendar cell shows modal → create Bonus Campaign or Tournament (pre-fills date).

**Key features:**
- `detectConflicts()` — same type+segment+overlapping dates → red outline + ⚠ flag
- `saveAsTemplate()` / `createFromTemplate()` / `duplicateCampaign()`
- `exportCSV()` / `exportJSON()`
- "Add to Calendar" from CG and TG with duplicate detection
- AI-assisted campaign creation from CG/TG results
- **Period Forecast panel** — "Forecast" toggle in controls-bar opens panel with Брутто → −Наложение → Нетто, cost, coverage, top-pairs breakdown

**Forecast panel** (`retention-calendar/forecast-panel.js`):
- Toggle: `window._rcToggleForecast()` → `toggleForecastPanel()` in forecast-panel.js
- Period: defaults to current FullCalendar view (`getCalendarPeriod()` from `calendar.js`); custom date range via two `<input type="date">` inputs
- Recalculates on: store change (campaigns added/deleted/dragged), view toggle click, custom range input
- i18n: reads `window._NAV_I18N[lang][fc_*]` keys set by `nav-utils.js`
- No API calls — pure client-side via `aggregateForecast()` from `../forecast.js`

**State:** `rc_campaigns` + `rc_templates` localStorage keys.

---

## Data flows

### Unified Configurator — Bonus
```
configurator.html + configurator.js
  → POST /api/generate → buildConfig() ← { welcome, ndb, reload, dep2, dep3, wager,
                                            cashback, contrib, fsSpec, econ, reg, cur }
  → POST /api/recalc (with B.ov overrides) → recalcCosts()
  ← { costs: { w_p10, w_p50, w_p90, ndb, rl, d2, d3, fs, total }, ratio, maxRisk }
  → updateBonusCostDisplay() patches DOM in place (no full re-render)
```

### Unified Configurator — Tournament
```
configurator.html + configurator.js
  → POST /api/tournament/generate { type, params: { geo, segment, totalPlayers, … } }
  ← { spec, econ: TournamentEconomics (flat), params, cur, region, lic }

  TournamentEconomics flat fields (no scenarios array):
  eligible, participantsLow/Mid/High, ggrLiftLow/Mid/High,
  netMarginLow/Mid/High, totalValueMid, roi, engagementMultiplier,
  costPerActiveMid, retentionValue, prizePoolCost, breakEvenParticipants
```

### Unified Configurator — Loyalty
```
configurator.html + configurator.js
  → POST /api/loyalty/generate { mode, region, segment, players, avgdep, arpu,
                                  numTiers, topCashbackRate (fraction 0–0.30), … }
  ← { config: LoyaltyConfig, econ: LoyaltyEcon }

  config: { mode, tiers[], earnRedeem, missions[], hasMissions, region, segment, … }
    tiers[]: { name, label, minPoints, bonusMultiplier, cashbackRate, freeSpinsMonthly, … }
    missions[]: { id, name, objective, target, rewardType, rewardValue, frequency, link? }
  econ: { monthlyCostUSD, costRatioPct (%), retentionLiftPct (%), roi3m (ratio),
          breakEvenMonths (number|null), totalLiabilityUSD, tierRewardCostUSD,
          missionCostUSD, additionalRevenue3m, avgEarnedPointsPerPlayer, … }
```

### Games tab — shared across Bonus / Tournament / Loyalty (Phase 1, 2026-07-07)
```
configurator.js (all 3 promo types share this)
  CS.connectedProviders — localStorage `cfg_providers`; [] = no filter (all 18 providers)
  → POST /api/games/recommend { geo, segment, providers, uiLang }
      geo/segment per type: bonus→CS.bonus.{geo,segment}, tournament→CS.tournament.{geo,segment},
      loyalty→CS.loyalty.{region,segment} (loyalty has no country-level geo — region cluster used directly)
  ← { sections: { popular, live, fast, highVolatility, mobileFriendly }, scores, region, all }
      sections are NOT mutually exclusive (a game can appear in several); capped at 8 games each
  No AI call — deterministic recommendGamesForContext(), same engine as tournament's recommendGames()
  but with no mechanic gate (type/scoring omitted) since CRM game picks aren't scoped to one mechanic.
```

### Legacy Bonus Configurator
```
configurator.html + app.js + configurator-extra.js  ← LEGACY, no longer active
  → POST /api/generate → buildConfig() → config
  ← { welcome, ndb, reload, dep2, dep3, wager, cashback, contrib, fsSpec, econ, reg, cur }

Override change → POST /api/recalc → recalcCosts() ← { costs, ratio, maxRisk }
```

### AI Campaign Generator
```
campaign-generator.js
  → POST /api/campaign/generate → campaignService.generateCampaign() → buildConfig() + campaignExplanation()
  ← { mechanic, explanation, alternatives, econ, … }

  → POST /api/campaign/texts  ← { push[3], email[3], sms[3], telegram[3], popup[3] }
  → POST /api/campaign/audit  ← { checks[5], recommendations[2-4] }
  → POST /api/campaign/optimize ← { recommendations[2-4] }
  → addCampaignToCalendar() → rc_campaigns localStorage
```

### Tournament Generator
```
tournament-generator.js
  → POST /api/tournament/generate { type, params: { totalPlayers, segment, … } }
  → calcTournamentEconomics() → eligible = round(totalPlayers × SEGMENT_RATIO[segment])
  ← { spec, econ: { totalPlayers, segmentRatio, eligible, … }, params, cur, region, lic }

  → POST /api/tournament/texts / /audit
  → POST /api/tournament/optimize { mode:'optimize'|'review' }
  ← { realism:{verdict,summary,checks[]}, recommendations[] }
  → addTournamentToCalendar() → rc_campaigns localStorage
```

### Retention Calendar
```
retention-calendar.js (Vite bundle from /dist/)
  ← rc_campaigns localStorage (campaigns)
  ← rc_templates localStorage (templates)
  → FullCalendar render (Month/Week/List)
  → detectConflicts() → red outline events
  → exportCSV() / exportJSON()
  → AI: window._rcNewCampaignOnDate(dateStr) / window._rcNewTournamentOnDate(dateStr)
```

### Period Forecast
```
retention-calendar/forecast-panel.js (bundled)
  ← rc_campaigns (via store.getState())
  ← current view period (via calendar.getCalendarPeriod()) OR custom date inputs
  → forecast.js: aggregateForecast(campaigns, start, end)
      → normalizeCampaign() per campaign (by sourceType)
      → pairCannibalization() for all overlapping pairs
      ← Forecast { gross, overlapLoss, net, netProfit, byDay[], pairs[], coverage }
  → renders panel: Брутто / −Наложение / Нетто / Прибыль + coverage + top pairs
  Trigger: store change, view toggle, custom range input change
```

---

## Incremental Revenue v2 — model reference

```
lift = min(0.40, base × F1 × F2 × F3 × F4 × F5)
```

| Factor | Formula | Notes |
|--------|---------|-------|
| Base | `SEG_LIFT[seg]` | new=0.25, mid=0.18, vip=0.12 |
| F1 Wager | `penalty = ratio<1 ? pow(ratio,1.5) : clamp(ratio,1,2)` where `ratio=beW/wagerX`; `F1 = clamp(0.7 + 0.3×clamp(penalty,0.3,2), 0.65, 1.35)` | **Nonlinear** penalty when wager>breakeven — at ratio=0.8 gives 0.716 not 0.8 |
| F2 Generosity | `effectiveValue = (matchPct/100) / max(wagerX/10, 1)`; `F2 = clamp(0.85 + 0.30×min(effectiveValue,1), 0.85, 1.15)` | **Effective value** accounts for wager burden — 200% match at 30x ≈ 0.917, not 1.15 |
| F3 Mechanics | `1 + NDB×0.06 + RL×0.08 + D2×0.04 + FS×0.04 + CB×0.07` | max ≈ 1.29 |
| F4 RTP | `clamp(0.94 + 0.12 × ((rtp−0.85)/0.14), 0.94, 1.06)` | range 85–99% |
| F5 Platform | `{ mobile:1.05, desk:0.97, both:1.0 }` | — |

**F1/F2 calibration rationale (2026-06-22):** Old linear F1 gave only −6% penalty at wager=30x vs breakeven=24x. New `pow(ratio,1.5)` gives −28% — more realistic since players see high-wager bonuses as low-value. F2 now divides by `wagerX/10` so a 200%/30x bonus no longer scores as generous as a 200%/5x bonus.

---

## Regulatory strings

`v_` prefix and `reg_` prefix are i18n keys resolved in `app.js` at render time — NOT raw strings in API output.

Active `reg_` key sets: `reg_mga_1..5`, `reg_ukgc_1..6`, `reg_dga_1..4`.

---

## Environments

Single Vercel project — **`bonus-generator`** (prod alias `bonus-generator.vercel.app`), connected to `victorGorinov/bonusGenerator` on GitHub. One project, two branches:

| Branch | Environment | Purpose |
|--------|------------|---------|
| `main` | Production | Auto-deploys on push — live at `bonus-generator.vercel.app` |
| `stage` | Preview | Auto-deploys on push to `stage` — alias `bonus-generator-git-stage-*.vercel.app` (behind Vercel's preview-deployment SSO wall; open it in a browser logged into the Vercel account to check it, `curl` will just get redirected) |

**Do not confuse with `bonus-engine` / `bonus-generator-sp7k`** — two other Vercel projects that were *also* connected to this same repo/branch (discovered 2026-07-03: a prod outage on `bonus-generator.vercel.app` traced back to `DATABASE_URL`/`JWT_SECRET` only having been configured on `bonus-engine`, which is not the project actually serving traffic). Both had their git integration disconnected (`vercel git disconnect`) so they no longer auto-deploy — the projects themselves still exist but are dead weight, not part of the deploy pipeline. `.vercel/repo.json` in this repo is linked to `bonus-generator`.

When `NODE_ENV=staging`: adds `X-Environment: staging` + `X-Robots-Tag: noindex`.

**Workflow:** `feature/* → stage (test) → main (prod)`

---

## Environment variables

```
ANTHROPIC_API_KEY=   # Required — validated at startup via Zod EnvSchema
RESEND_API_KEY=      # Required — validated at startup
NOTIFY_EMAIL=        # Default: victor.gorinov@gmail.com
PORT=3000            # Optional
NODE_ENV=            # development | production | staging | test
DATABASE_URL=        # Required — Neon Postgres connection string (postgresql://...)
JWT_SECRET=          # Required — min 32 chars, e.g. `openssl rand -hex 32`
JWT_EXPIRY=          # Default: 7d
COOKIE_DOMAIN=       # Optional — empty locally, set in prod for the `_bt` auth cookie
ADMIN_EMAILS=        # Optional — comma-separated emails auto-promoted to role='admin' at register/login (admin bootstrap)
```

**Local dev without a real DB:** the server boots and non-DB routes (health, static pages, `/api/generate` if it didn't need auth) work fine with a placeholder `DATABASE_URL` — the Pool is only touched on an actual query (register/login/me). `DATABASE_URL` and `JWT_SECRET` are still required by `EnvSchema` even so (fail-fast on missing config, per existing project convention).

---

## Security

- **CSP**: `scriptSrc: ['self']` (no unsafe-inline — all JS external). `scriptSrcAttr: ['unsafe-inline']` for onclick handlers (pending addEventListener conversion).
- **Zod validation** on all API inputs before controller via `validate(schema)` middleware
- **Rate limiting** per endpoint class
- **requestId middleware**: `x-request-id` on every response
- **Auth (Phase 1, added 2026-07-02, guest-access revised 2026-07-02, code-review fixes 2026-07-03)**: email+password (bcrypt, 12 rounds), JWT in an httpOnly + Secure(prod/staging) + SameSite=Strict cookie (`_bt`, expiry synced to `JWT_EXPIRY` via `JWT_EXPIRY_MS` — see below). No roles/workspace-members/invites yet — 1 workspace per user, auto-created at registration (see `AUTH_IMPLEMENTATION_PLAN.md`).
  - Tool routes (`/api/generate`, `/api/campaign/*`, `/api/tournament/*`, `/api/loyalty/*`, `/api/reports/*`, `/api/games/*`) use `optionalAuth` + `requireFeature(x)` — guests reach them without an account but are gated to `GUEST_FEATURES` (see **Admin & feature access**). `/api/auth/me` and `/api/admin/*` are hard-gated.
  - Data persistence (moving `cfgSaved`/`be_campaigns`/`savedTournaments`/`savedLoyaltyPrograms`/`rc_campaigns`/`rc_templates` from localStorage to Postgres) is **not** done yet — that's Phase 2/3 of `AUTH_IMPLEMENTATION_PLAN.md`. Until then, guest and logged-in users save identically to browser `localStorage`; there is intentionally no login-gate on Save/Add-to-Calendar or on the Retention Calendar page. A landing→app login/register interstitial (with a "continue as guest" choice) was considered but deferred until Phase 2/3 actually makes the account/guest distinction functional.
  - **Email normalization**: `auth.schema.ts`'s `EmailSchema` does `.trim().toLowerCase()` before `.email()` — `users.email` has a plain case-sensitive Postgres `UNIQUE` constraint (no citext), so without this, differently-cased emails would create duplicate accounts and logins with a different case than registration would fail.
  - **`db/client.ts`**: `ssl: true` (not `{ rejectUnauthorized: false }`) for `sslmode=require` connection strings — Neon issues publicly-trusted certs, so full TLS chain validation works; disabling it would accept a MITM's self-signed cert. `pool.on('error', ...)` is registered (logs via `logger`) since an unhandled `'error'` on an idle pg client crashes the process.
  - **`Auth.ts registerUser`**: the pre-check `SELECT` for an existing email is a fast path, not a lock — a concurrent duplicate-email registration is caught by translating the Postgres unique-violation (`err.code === '23505'`) into the same 409 `EMAIL_TAKEN`, instead of letting it fall through as a generic 500.
  - **Cookie/token lifetime sync**: `src/domain/auth/jwt.ts` exports `JWT_EXPIRY_MS = ms(JWT_EXPIRY)` (the `ms` package — same parser `jsonwebtoken` uses internally for a string `expiresIn`); the auth cookie's `maxAge` uses this instead of a separately hardcoded constant, so changing `JWT_EXPIRY` can't desync the two.
  - **`requireAuth`/`optionalAuth`** both delegate to `authCookie.ts`'s `resolveUser(req)` — the cookie-read + JWT-verify + `req.user` mapping lives in one place.

**Error response shape**: `{ code: string, message: string }`.

---

## Admin & feature access

**Added 2026-07-07.** Admin panel + per-user feature-access control, forward-compatible with future tariff plans.

**Data model** (migration `003_admin_roles.sql`, applied manually like 001): adds to `users` — `role` (`'user'|'admin'`, default `'user'`), `status` (`'active'|'disabled'`), `plan` (tariff preset key, default `'free'`), `features` (JSONB per-user overrides, default `{}`). All defaulted → existing rows keep full access.

**Layered access resolution** — `src/config/features.ts` (presets) + `src/domain/auth/access.ts` (`resolveFeatureAccess`). Precedence, highest first:
1. `status='disabled'` → all off
2. `role='admin'` → all on
3. per-user override (`features[k]` is a boolean) wins over…
4. …the plan preset `FEATURE_PRESETS[plan]`
5. guest (no row) → `GUEST_FEATURES`

`FEATURES = bonus, campaign, tournament, loyalty, games, reports, calendar`. `GUEST_FEATURES` = bonus/campaign/tournament/games on, loyalty/reports/calendar off. `FEATURE_PRESETS.free` = all-on today (registered users unchanged); `pro` is a placeholder — **this is the tariff-plan seam**: adding a tier = add a preset row + a plan option in the admin UI, no enforcement/route/schema changes. Per-user `features` stays an OVERRIDE layer (absent key = inherit plan), so changing a user's plan moves their access wherever no explicit override is set.

**Enforcement (from DB, never the JWT — so changes apply within seconds):**
- `requireFeature(feature)` (`src/middleware/requireFeature.ts`) — on each tool route. Guest → `GUEST_FEATURES` (no DB hit). Logged-in → `getUserAccessById`, behind a **5s bounded TTL cache** (`ACCESS_TTL_MS`) so the Configurator's per-slider `/api/recalc` burst doesn't re-read the row every call; admin changes still apply within the TTL. Failure handling avoids elevation: `row === null` (deleted user / malformed token `sub` — `getUserAccessById` returns null for a non-UUID id instead of throwing) → treat as guest (safe, no overrides possible); a **thrown** lookup error (transient DB) → **fail closed** 503 `SERVICE_UNAVAILABLE` (a restrictive per-user override could otherwise be bypassed). → 403 `FEATURE_FORBIDDEN`.
- `requireAdmin` (`src/middleware/requireAdmin.ts`) — self-contained (resolves cookie itself, no upstream optionalAuth). **Fail-closed**: any error/missing-row/non-admin/disabled → 403 `FORBIDDEN`. Sets `req.adminId` for self-protection guards.

**`disabled` is enforced on every authenticated surface, not just tool routes:**
- **Login** (`loginUser`) — a disabled account is rejected 403 `ACCOUNT_DISABLED` (can't re-mint a session).
- **`/api/auth/me`** — 403 `ACCOUNT_DISABLED`.
- **`/api/saved/*`** — `requireActiveUser` (`src/middleware/requireActiveUser.ts`, runs after `requireAuth`, before `requireWorkspace`) → 403 `ACCOUNT_DISABLED`, uncached so revocation is immediate.
- **Tool routes** — `requireFeature` resolves disabled → all-off → 403 `FEATURE_FORBIDDEN`.

**Admin bootstrap** — `ADMIN_EMAILS` env (comma-separated, normalized via shared `normalizeEmail()`; `isAdminEmail()` in `config/index.ts`). **Register-time only**: listed addresses register straight as `admin`. There is intentionally **no login-time re-sync** — the admin panel is the single source of truth for roles after registration (a login re-sync would silently revert panel demotions and never demote on env removal). Promoting a pre-existing account is done via the panel (or one-time SQL for the very first admin).

**Admin API** — `src/use-cases/AdminUsers.ts` (guards) → `admin.controller.ts` (`createAdminController({ db })`) → `admin.routes.ts` (`router.use(apiLimiter, requireAdmin)`; list uses `validateQuery(AdminListQuerySchema)`). Guards run **inside a transaction** (`updateUser`/`deleteUser` do `SELECT … FOR UPDATE` on the target + lock the active-admin set before the last-admin check) so concurrent demotes/deletes can't race past `LAST_ADMIN` to zero admins. Also can't self-demote/-disable/-delete. `updateUser` stores only overrides differing from the plan preset. Search (`listUsers`) escapes `%`/`_` and uses `ESCAPE '\'`.

**Frontend** — `public/admin.html` + `admin.js` (self-gates via `/api/features`; only a genuine non-admin answer shows the denied screen, transient meta/list errors show a retryable error). `effective()` mirrors backend precedence exactly (**disabled → admin → override → plan**); dirty-detection compares pruned-vs-pruned so a redundant stored override doesn't false-flag a row. `nav-utils.js` `_rtmRenderUserChip` shows an **Admin** link only when `me().role==='admin'`. `/api/auth/me` returns `{ user{…,role}, features }`; `/api/features` returns the effective map for any caller.
- **`public/feature-gate.js`** — shared frontend gate loaded on loyalty/reports/configurator/generator pages. `FeatureGate.ensure(feature)` (called at each generate handler entry: loyalty `generateProgram`, configurator `onGenerateLoyalty`, reports `doGenerate`) shows a "sign in required" overlay when the feature is off for the caller, instead of the request 403-ing into an opaque error. Cosmetic — the real gate is `requireFeature`.

**Tests**: `access.test.js` (resolve precedence), `accessResolve.disabled.test.js` (uuid-tolerant lookup), `adminUsers.test.js` (guards via a fake Pool+client — no real DB), `api.guestAccess.test.js` (hybrid gating: guest 200 for bonus/campaign/tournament/games, 403 for loyalty/reports, `/api/features` shape, admin 401), `api.disabledUser.test.js` (live-DB: disabled account blocked at login/me/saved/tool routes).

**Not done (future):** billing/subscriptions (Stripe, `plan_expires_at`, status webhooks), an editable `plans` DB table (presets live in code for now), and a plan selector wired to real tiers — all deferred; the seam above absorbs them without schema/enforcement changes.

---

## Tests

```bash
npm test             # 393 tests, 28 files
npm run test:watch   # vitest watch mode
```

**MockAIProvider** (`src/ai/providers/mock.ts`): inject via `setAIProvider(new MockAIProvider([...]))` or `createCampaignController({ ai: new MockAIProvider([...]) })`.

**Client-side parity tests** (`tests/domain/*.parity.test.js`): verify that the browser-side JS modules (`bonus-cost.js`, `loyalty-econ.js`, `tournament-econ.js`) produce identical results to the backend domain functions for the same inputs.

---

## i18n architecture

**Language key**: `bonusLang` in localStorage. Values: `'en'` | `'ru'`.

**Per-page pattern:**

| Page | Switch fn | Dict | Flash prevention |
|------|-----------|------|-----------------|
| campaign-generator | `setUILang(lang)` | inline i18n object | `.main{opacity:0}` + `.main.ready` via JS |
| tournament-generator | `setTournLang(lang)` | `TG` dict + `tg()` | same |
| loyalty-generator | `setLang(lang)` | `L` dict + `t()` | same |
| retention-calendar | `setRCLang(lang)` → reload | `getT()` from `i18n.js` | same |

**nav-utils.js** handles nav sidebar translation on all pages except campaign-generator (which has its own `setUILang` covering nav via `data-i18n`).

**Adding a new translatable string:**
1. If in nav sidebar → add key to `_NAV_I18N` in `nav-utils.js` + `data-i18n="key"` attribute in HTML
2. If in tournament-generator → add key to `TG.en` + `TG.ru`, use `tg('key')`
3. If in loyalty-generator → add key to `L.en` + `L.ru`, use `t('key')`
4. If in retention-calendar module → add key to `EN`/`RU` in `retention-calendar/i18n.js`, use `getT()` at call site; then rebuild bundle with `npm run build`
5. If in campaign-generator → add key to both locale objects in `setUILang()`, add `data-i18n="key"` to HTML element
6. If in forecast-panel → add key to `_NAV_I18N` in `nav-utils.js` (no rebuild needed); read via `window._NAV_I18N[lang][key]`

**Forecast i18n keys** (in `_NAV_I18N`, EN + RU): `fc_toggle`, `fc_title`, `fc_gross`, `fc_overlap`, `fc_net`, `fc_profit`, `fc_coverage`, `fc_pairs_title`, `fc_no_econ`, `fc_range`

---

## Client-side economics modules

Four browser-side JS modules mirror backend domain logic for real-time recalculation without API round-trips:

| File | Mirrors | Used by |
|------|---------|---------|
| `public/bonus-cost.js` | `src/domain/bonus/recalcCosts.ts` | configurator.js (recalc tab), configurator-extra.js (legacy) |
| `public/bonus-selected-econ.js` | `src/domain/bonus/selectedEcon.ts` | campaign-generator.js (selection-aware econ) |
| `public/loyalty-econ.js` | `src/domain/loyalty/calcEconomics.ts` | loyalty-generator.js |
| `public/tournament-econ.js` | `src/domain/tournament/calcEconomics.ts` | tournament-generator.js |
| `public/balance-solver.js` | — (generic solver) | tournament/loyalty/configurator |
| `public/forecast.js` | `src/domain/forecast/` (3 files) | retention-calendar/forecast-panel.js |
| `public/loyalty-missions-link.js` | `src/domain/loyalty/linkMissions.ts` | loyalty-generator.js (Step 2 preview) |
| `public/bonus-benchmarks.js` | `src/config/benchmarks/bonusBenchmarks.ts` | configurator.js (parameter benchmark bands) |

**balance-solver.js** — `solveToTarget({ draft, levers, recalc, metricOf, target, constraints?, maxIter? })`: iterates over `levers` (enum swaps + multiplicative steps) until `metricOf(recalc(draft)) >= target` or all levers exhausted. `constraints` — optional array of `{ check(draft, cfg) → bool }` guards; a lever step is skipped if it would violate any constraint (used by bonus solver to enforce license wager/bonus caps). Returns `{ draft, reached }`.

**Parity tests** in `tests/domain/*.parity.test.js` assert identical output between JS modules and backend TypeScript for the same inputs. Run before shipping changes to either side.

---

## Parameter benchmarks & explainability (Слой A, 2026-07-19)

Answers expert feedback: "why these params, what happens if I change them, and where's the data from?" The bonus parameters are geo/license **defaults** (a lookup, not a model-optimised value) — the UI now says so honestly and shows a recommended range instead of over-claiming.

**Data module** — `src/config/benchmarks/bonusBenchmarks.ts` (single source of truth) + `public/bonus-benchmarks.js` (browser mirror, `window.RetomatBenchmarks`, parity-tested). API:
- `getBenchmark(param, region, license)` → `{ band:{min,rec,max}, unit, whyKey, cap? }` or `null`. `param ∈ w_wager | rl_wager | ndb_wager | w_pct | rl_pct | ndb_amt`. Welcome wager is geo/license-specific (by-license table with region fallback); the rest are geo-independent market norms. **Regulatory wager caps** (UK/DK 10×) are always attached for `ukgc`/`dga` and clamp the band, producing an `over_cap` state above the ceiling.
- `classifyValue(value, bench)` → `'below' | 'on' | 'above' | 'over_cap'` (the chip colour).
- `regulatoryNote(license, mechanic)` → i18n key or null. BR `bets_br`: welcome → `reg_warn_br_welcome` (hard — welcome bonuses are **prohibited** by Law 14.790/2023 Art. 29, but the mechanic is NOT auto-removed — operator deletes manually); reload/ndb → `reg_warn_br_soft`. UK/DK/CO → their note keys.

**Provenance:** benchmark ranges researched 2026-07-19 from market-practice + regulatory sources — see `tasks/param-explainability-plan.md` (per-geo + per-LATAM-country wager tables with citations) and `tasks/param-explainability-copy.md` (all RU/EN strings). Wager-by-geo is firm; match%/reload/NDB are market norms; UK/DK caps + BR prohibition + CO 1.6%-GGR volume cap are regulatory facts.

**Configurator UI** (`configurator.js`, `renderMechRow`):
- `mpInpBench(id, label, val, unit, min, max, benchParam)` — like `mpInp` but renders a live benchmark line (recommended range + coloured chip + ℹ "why" tooltip) that reclassifies on `oninput` via `cfgBenchUpdate`. Applied to **currency-independent** params only (wager, match %); `ndb_amt` is deliberately NOT chipped (its band is USD but the field shows local currency → would misclassify).
- `cfgRoleBadge(key)` — mechanic role badge: welcome/ndb = `Acquisition · low-margin`, reload/cashback/dep2/dep3 = `Retention · margin` (encodes "welcome is a loss-leader, margin lives in retention").
- `cfgGuardrailInner` — welcome-wager guardrail banner shown when the value exceeds the recommended max (`above`/`over_cap`).
- `cfgRegBanner(mechanic)` — regulatory banner per mechanic (BR hard/soft, UK/DK/CO notes).
- `cfgBonusRL()` resolves `{region, license}` from `cfgGeo(CS.bonus.geo)`. i18n keys (`bench_*`, `role_*`, `guardrail_wager`, `reg_*`) live in `CFG_I18N` (EN+RU).
- **Load-order note:** `configurator.js` is a classic script that inits during parse, BEFORE the deferred ESM helpers set `window.RetomatBenchmarks`; the init IIFE re-renders once on `DOMContentLoaded` (deferred modules run before it) so benchmark bands populate.

**A3 honest copy** — `src/domain/campaign/explanation.ts` imports `getBenchmark`; the wager rationale changed from the false "calculated via Truncated Normal — optimal balance" to "baseline for {region}; recommended range {min}–{max}×".

**A4 data fixes** — `src/config/geo/eu.ts` DGA welcome wager `25→10` (was above Denmark's 10× legal cap — a real data bug); `src/config/geo/latam.ts` added `wW:35` override to `segob` (MX) + `mincetur` (PE) (were inheriting the offshore base 40, above MX/PE practice).

**Tests:** `bonus.benchmarks.parity.test.js` (server↔client matrix + regulatory sanity), `geo.wagerOverrides.test.js` (DGA/MX/PE/AR-CL/BR wager in buildConfig), `explanation.wager.test.js` (no "optimal", surfaces range). **Not yet ported to the `generator.js` hub** — deferred to a 2nd iteration as a passive "vs benchmark" annotation (hub is a read-only AI-wizard, no editable param fields); data module already shared so the port is cheap.

---

## Critical data model pitfalls

These are non-obvious facts that have caused bugs; always verify before touching related code.

**`sP50.cost`, `sP10.cost`, `sP90.cost` from `buildConfig`** — values are already TOTAL (multiplied by `pl`). Never multiply by `pl` again. Same for `maxRisk` and all `recalcCosts` output fields.

**`E.roi3` from `buildConfig`** — already a percentage (e.g., `160` means 160%). Do NOT pass to `fmtPct()` (which multiplies by 100). Use `.toFixed(0) + '%'` directly. This is the **Platform ROI** card (`bc-roi`) in the Configurator — do NOT recalculate it from bonus cost ratios (old bug produced 1135% due to near-zero campBudget at high wager).

**`data.maxRisk` from `/api/recalc`** — lives at the TOP LEVEL of the response object, not inside `data.costs`. `data.costs` is `{ w_p10, w_p50, w_p90, ndb, rl, d2, d3, fs, total }` with no `maxRisk` field. In `updateBonusCostDisplay`: use `upd('bc-risk', data.maxRisk)`, NOT `upd('bc-risk', costs.maxRisk)` (the latter is `undefined` → renders "—").

**Tournament `econ` is a flat object** — `calcTournamentEconomics()` returns flat fields (`participantsMid`, `ggrLiftMid`, `roi`, `engagementMultiplier`, etc.). There is **no `scenarios` array**. The `roi` field is already a percentage integer (e.g., `120` for 120%).

**Loyalty API returns `{ config, econ }`** — tiers live at `result.config.tiers`, missions at `result.config.missions`. Tier fields: `freeSpinsMonthly` (not `freespins`), `bonusMultiplier` (not `bonusMult`). Econ fields: `monthlyCostUSD`, `costRatioPct` (already %), `retentionLiftPct` (already %), `roi3m` (fraction), `breakEvenMonths` (number|null), `totalLiabilityUSD`. Divide `costRatioPct` / `retentionLiftPct` by 100 before passing to `fmtPct()`.

**`LoyaltyMissionsResponse` has no `name` field** — only `{ id, narrative, tierEffect? }`. To display the mission name, join by `id` with `CS.loyalty.result.config.missions`.

**`topCashbackRate`** — stored in UI state as percentage integer (e.g., `10`), sent to API divided by 100 (i.e., `0.10`). Schema: `max(0.30)`.

**`src/config/games/catalog.json` provenance** — 160 entries, manually curated from general industry knowledge (real, well-known titles per provider), NOT scraped or licensed from SlotCatalog or provider sites (both explicitly prohibit scraping/reuse in their ToS — see chat history 2026-07-07 for the research). RTP values are generally accurate (publicly disclosed per-game by regulation) but **regions/segments/slotRank are best-effort approximations**, not verified against real per-jurisdiction licensing. Treat as demo/illustrative data — if this ever needs to back real per-operator recommendations, source a real per-provider game feed (SlotCatalog API license, or the operator's own aggregator export) instead of expanding this file further by hand.

**`recommendGames()` `type`/`scoring` are now optional** (generalized 2026-07-07 for the Games tab) — omitting both means no mechanic gate and no scoring-model boost, just region/segment/provider/minBet/mobile/popularity scoring. Tournament call sites (`recommendTournamentGames`) always pass both and are unaffected. The `all` field on the return value is the full filtered+sorted pool (not truncated to top 10 like `primary`/`alternatives`) — use it when grouping into sections, since a top-10 slice can hide entire mechanics (e.g. zero live/crash games if slots dominate the top scores).

---

## Pending work

**P0 (auth — `AUTH_IMPLEMENTATION_PLAN.md`, Phases 1–4 DONE 2026-07-07):**
- ~~Neon DB, Phase 1 auth core~~ — done 2026-07-03 (see Completed log).
- ~~Phase 2/3/4 (server-side persistence + frontend repo-layers + migration)~~ — done 2026-07-07 (see Completed log + "Server-side persistence" section below).
- Landing→app login/register interstitial with a "continue as guest" choice — designed but still deferred; the account/guest split is now functionally real (accounts persist to Postgres, guests to localStorage), so this can be revisited. Current UX choice: transparent localStorage fallback for guests, no forced redirect (nav-utils shows a "Sign in" link / user chip instead).
- Remaining polish: `saved_configs` has no read UI yet (write-only mirror — Configurator never listed cfgSaved); per-workspace `connectedProviders` (still localStorage `cfg_providers`); optional server-side conflict/merge if the same account edits on two devices offline (last-write-wins today via client-id upsert).

**P1 (tests):**
- Add DK snapshot to `buildConfig.test.js`
- Add RU/KZ/MN snapshots for payout fallback path coverage

**P2 (UX) — from `UX_DEV_PLAN.md`:**
- R5: Model assumptions collapsible block (ARPU/CAC/lift-cap constants visible to user) + remaining tooltip coverage audit
- R6: Stale econ indicator in Configurator (amber banner when generate-sensitive params change after Generate)
- R7: Glossary panel ("?" button in topbar, 11 terms EN+RU, slide-in drawer)
- R8: Copy-all channel button per channel + PDF export (full campaign, audit standalone, tournament)

**P2 (features):**
- Task A: Projected result per AI recommendation (apply param-change to 5-factor formula, show lift delta)
- Retention Calendar: read `?rcDate=` query param in tournament-generator.js to pre-fill date from calendar redirect
- Game recommendations Phase 2: replace hand-curated `catalog.json` with a real per-provider game feed (SlotCatalog API license, or the operator's own aggregator export — see Critical data model pitfalls for why scraping isn't an option), add genre tags/releaseDate/jackpot flag, build full lobby-style sections (New Releases, Jackpots) beyond the current Popular/Live/Fast/Volatility/Mobile buckets, move `connectedProviders` from localStorage to a per-workspace setting once Phase 2/3 auth persistence lands

**P3 (frontend):**
- Convert `onclick=` handlers to `addEventListener` → remove `scriptSrcAttr: 'unsafe-inline'` from CSP

**P4 (post-auth):**
- AI response caching (Redis/KV)
- Queue for heavy generation (Bull/BullMQ)
- Rate limits per authenticated user
- OpenAPI from Zod schemas

---

## Completed work log

- ~~**Parameter benchmarks & explainability (Слой A)**~~ — done 2026-07-19, from expert feedback ("why these params, what happens if I change them, where's the data from?"). New `src/config/benchmarks/bonusBenchmarks.ts` + `public/bonus-benchmarks.js` mirror (`getBenchmark`/`classifyValue`/`regulatoryNote`, parity-tested): recommended wager/match/NDB ranges + regulatory caps (UK/DK 10×) per geo/license, ranges **researched with citations** (`tasks/param-explainability-plan.md`, `tasks/param-explainability-copy.md`). Configurator (`configurator.js`) now shows, next to each currency-independent param, a live benchmark line (range + green/amber/red chip + ℹ "why"), mechanic role badges (welcome/ndb = Acquisition·low-margin, reload/cashback/dep = Retention·margin), a welcome-wager guardrail banner, and per-license regulatory banners (🇧🇷 BR welcome-prohibition hard-warning **without auto-removing the mechanic**, BR reload/ndb soft note, UK/DK/CO notes). Honest copy fix in `explanation.ts` ("optimal balance via Truncated Normal" → "baseline; recommended range"). **Data bugs fixed:** DGA welcome wager `25→10` (exceeded Denmark's 10× legal cap), MX/PE `wW:35` override (were inheriting offshore base 40). Cosmetic: removed doubled unit labels (`Match % %`→`Match %`). Tests: `bonus.benchmarks.parity`, `geo.wagerOverrides`, `explanation.wager` (678 total green). Verified in-browser across DE/UK/BR/MX. Hub (`generator.js`) port deferred to a 2nd iteration (read-only wizard → passive annotation). See **Parameter benchmarks & explainability** section.
- ~~**Auth Phases 2–4 (server-side persistence + frontend sync + migration)**~~ — done 2026-07-07. Backend: migration `002_saved_items.sql` (applied to live Neon via `scripts/migrate.ts` — psql isn't installed, runs the `.sql` through the pg pool) creates six uniform per-workspace tables `{id, workspace_id, client_id, data JSONB, created_at, updated_at}` + `UNIQUE(workspace_id, client_id)` — **deviates from the plan's per-column `saved_configs`** (pointless: cfgSaved has no read path) in favour of a uniform blob keyed by the record's own client id. New `src/use-cases/SavedItems.ts` (generic list/upsert/delete over an `ENTITIES` whitelist — table names never come from input), `savedItems.controller.ts`, `savedItems.routes.ts` (single generic `/:entity` + `/:entity/:id`, mounted `/api/saved`, behind `requireAuth`+`requireWorkspace`), `requireWorkspace.ts` (resolves `req.workspaceId` from `req.user.id`, in-memory cached 1:1), `savedItems.schema.ts` (`{id, data}` upsert). Entities: `configs | campaigns | tournaments | loyalty-programs | calendar-events | calendar-templates`. Client id stays the identity → **no server-id reconciliation on the frontend and idempotent migration via `ON CONFLICT`**. Tests: `tests/integration/api.savedItems.test.js` (real DB, graceful-skip if unreachable, self-cleaning). Frontend model = **localStorage stays the working cache; logged-in users additionally mirror every write to the server and hydrate the caches on load**, so reports.js (reads localStorage directly) needs no changes. New `public/repo-http.js` (`window.RetomatRepo`: `isAuthed/pull/mirror/unmirror/hydrate`). `nav-utils.js` owns the whole sync: on load, if authed → **migrate guest localStorage → server once (`migrated_v1` flag), THEN hydrate all six caches, then fire `retomat:synced`** (ordering matters — hydrate before migrate would wipe guest data with an empty server); also renders the header user chip (name + Logout) / "Sign in" link, and `_rtmLogout` clears the caches + `migrated_v1` so a following guest doesn't inherit the account's data. Each page listens for `retomat:synced` and re-renders (generators + twins `generator*.js` + `reports.js` + retention-calendar `loadAll()`). Save/delete sites in configurator.js / campaign-generator.js / tournament-generator.js / loyalty-generator.js **and their `generator*.js` twins** mirror/unmirror; the external "Add to Calendar" writers (which poke `rc_campaigns` directly, bypassing repository.js) also mirror to `calendar-events`. `retention-calendar/repository.js` mirrors writes only (reads stay local; nav-utils owns hydration) — rebuild the bundle after touching it. `repo-http.js` added to all nav-utils pages. Guest access on tool routes unchanged (still `optionalAuth`). Verified end-to-end live (register → me → save → list → calendar-events → guest 401). Note: same-origin fetch already sends the `_bt` cookie by default, so the plan's "add credentials:'include' to every fetch" was unnecessary — only `repo-http.js` sets it explicitly.
- ~~**Auth Phase 1 (core)**~~ — done 2026-07-02: `users`/`workspaces` tables + `001_initial.sql` (applied to a real Neon DB provisioned via Vercel Marketplace), bcrypt + JWT httpOnly-cookie auth, `authLimiter` 5/min, `login.html`/`register.html`. Verified end-to-end against the live DB (register → me → logout → login → wrong-password rejected).
- ~~**Auth guest access**~~ — done 2026-07-02, same day as Phase 1: reverted the initial "guard everything" decision. Tool routes (generate/campaign/tournament/loyalty/reports) switched from `requireAuth` to `optionalAuth` — guests can generate/audit/optimize freely. Removed `auth-guard.js` (401→redirect) since it no longer had anything to guard against. Rationale: saved items are still localStorage-only (Phase 2/3 not built), so gating generation behind login had no functional benefit and only added friction — see Security section.
- ~~**Auth code-review fixes**~~ — done 2026-07-03, from a full code-review of the unpushed auth+landing diff (8 finder agents + verify pass, see Security section for the list): fixed TLS cert validation (`ssl: true`, was `rejectUnauthorized: false`), email case-sensitivity (normalize via `auth.schema.ts`), a registration race condition (unique-violation → 409 instead of 500), cookie/JWT-expiry desync (`JWT_EXPIRY_MS` via the `ms` package). Added `pool.on('error', ...)`, closed a test-coverage gap (`tests/integration/api.guestAccess.test.js` — campaign/tournament/loyalty/reports guest access through the real `app.js`, not a bespoke express instance), and deduped `requireAuth`/`optionalAuth` (→ `authCookie.ts`'s `resolveUser`) and `login.js`/`register.js` (→ shared `auth-form.js` + `.auth-*` classes in `styles.css`).
- ~~**Admin & feature access**~~ — done 2026-07-07: migration 003 (role/status/plan/features on `users`, applied), layered `resolveFeatureAccess` (`config/features.ts` + `domain/auth/access.ts`), `requireFeature` on all tool routes + `requireAdmin` (fail-closed) on `/api/admin/*`, `ADMIN_EMAILS` bootstrap, admin CRUD API (`AdminUsers.ts` guards: self- & last-admin), `GET /api/features` + `me` enrichment, `public/admin.html`+`admin.js`, nav Admin link. Tariff-plan seam laid in (`FEATURE_PRESETS` + `plan` column) but billing/plan-editing UI deferred. See **Admin & feature access** section.
  - **Code-review fixes** (same day, from an 8-finder review of the feature): (1) `disabled` now enforced at login/`me`/`/api/saved` (`requireActiveUser`), not only tool routes; (2) `ADMIN_EMAILS` is register-time only — dropped the login re-sync that reverted panel demotions; (3) `requireFeature` fails **closed** (503) on a thrown lookup error and `getUserAccessById` returns null for a non-UUID id, closing a fail-open elevation; (4) added a 5s TTL access cache for the `/api/recalc` hot path; (5) `admin.js` precedence fixed (disabled→admin) + pruned-vs-pruned dirty detection + robust denied/self handling; (6) last-admin guard made transactional (`SELECT … FOR UPDATE`, no TOCTOU); (7) escaped `%`/`_` in admin search; (8) `public/feature-gate.js` gives guests a "sign in" prompt on loyalty/reports instead of an opaque 403. Cleanups: shared `normalizeEmail`, `ALL_ON`/`fill` reuse, `validateQuery` middleware, removed dead `getUserById`.
- ~~**Unified Configurator**~~ — done: configurator.html + configurator.js (Bonus/Tournament/Loyalty), AI tabs, Economics panels, minD/maxWin overrides
- ~~**I4 (Loyalty AI)**~~ — done: missions endpoint, narratives, tier-link layer, persistence tests
- ~~**R3 (CG Basic/Expert toggle)**~~ — done: `cg_expert_mode` localStorage, VIP defaults to expert
- ~~**R4-B (Audit rule field)**~~ — done: `rule?: string` in AuditResponseSchema, buildAuditPrompt instruction, display in campaign-generator + tournament audit
- ~~**Economics UX clarity (tasks/ui-clarity-tooltips.md)**~~ — done 2026-06-22: currency fix (SITECUR_TO_USD), card subtitles, "Бонусная нагрузка" rename, scenario table columns, base segment row, abbreviation tooltips (LTV/ROI/RTP/вейджер), scenario dot layout, first-principles breakdown table (computeBonusBreakdown + renderBonusBreakdownTable), F1 nonlinear penalty + F2 effective value recalibration, ROI Платформы vs ROI Бонуса rename, MAX RISK top-level fix, factor table CSS grid alignment
- ~~**Game recommendations Phase 1 (CRM context)**~~ — done 2026-07-07: catalog expanded 58→160 games (manual curation, see Critical data model pitfalls for provenance caveat); `recommendGames.ts` generalized (type/scoring now optional, `providers?` filter added, `all` field for untruncated pool) and moved `domain/tournament/` → `domain/games/`; new `domain/games/sections.ts` (groupGamesBySection); new `GenerateGameRecommendations.ts` use-case (no AI, deterministic); new `POST /api/games/recommend` route (apiLimiter); new "Games" tab added to Bonus/Tournament/Loyalty in the unified Configurator, with a shared `CS.connectedProviders` checklist (localStorage `cfg_providers`) — see Games tab data-flow section. Phase 2 (real per-provider game feed, genre tags, jackpot/new-release sections, full lobby merchandising) deferred — see Pending work.
