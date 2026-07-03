# CLAUDE.md — Retomat: Retention OS for iGaming

Complete architecture reference for Claude Code sessions. Updated: 2026-07-02.

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
│   │   ├── geo/                     # eu.ts, cis.ts, crypto.ts, sweep.ts, mn.ts, latam.ts
│   │   └── games/                   # catalog.json (day-1 snapshot, ~15–20 games/geo) + catalog.ts (types + loader)
│   ├── db/
│   │   ├── client.ts                # Neon/pg Pool singleton
│   │   └── migrations/001_initial.sql  # users + workspaces (Phase 1 only; saved_*/calendar_* tables are Phase 2)
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
│   │   │   ├── benchmarks.ts        # tournamentBenchmarks() — deterministic realism checks
│   │   │   └── recommendGames.ts    # Pure: catalog scoring → top-5 primary + 5 alternatives
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
│   │   ├── GenerateTournament.ts    # generateTournament(), texts, audit, optimize (inject AIProvider)
│   │   └── GenerateLoyalty.ts       # generateLoyaltyConfig(), recalcLoyaltyConfig(), auditLoyalty(), optimizeLoyalty(), generateLoyaltyMissions()
│   ├── controllers/                 # All use createXxxController(deps) factory pattern
│   │   ├── auth.controller.ts       # createAuthController({ db }) — register, login, logout, me; sets/clears httpOnly cookie
│   │   ├── generate.controller.ts   # createGenerateController()
│   │   ├── campaign.controller.ts   # createCampaignController({ ai })
│   │   ├── tournament.controller.ts # createTournamentController({ ai })
│   │   ├── loyalty.controller.ts    # createLoyaltyController({ ai }) — generate, recalc, texts, audit, optimize, missions
│   │   ├── analytics.controller.ts  # createAnalyticsController() — analyze, saveActuals, explain
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
│   ├── generator.html               # Legacy — 301 → /campaign-generator.html
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
    ├── domain/recommendGames.test.js             # scoring determinism, type gating (live/slot), geo/segment rules
    ├── domain/compareCampaign.test.js            # percentile bands, flags, currency separation, division-by-zero
    └── integration/
        ├── api.generate.test.js
        ├── api.loyalty.test.js                   # 11 tests
        ├── api.loyalty.missions.test.js          # MockAIProvider fixture, id match, graceful missing ids
        ├── api.tournament.optimize.test.js
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

Only `/api/auth/me` requires a logged-in session (`requireAuth`). Every other `/api/*` route — `/api/generate`, `/api/campaign/*`, `/api/tournament/*`, `/api/loyalty/*`, `/api/reports/*` — is guarded by `optionalAuth`: it attaches `req.user` when a valid `_bt` cookie is present but never rejects an anonymous request. Guests can generate/audit/optimize freely; the account/guest distinction only matters once Phase 2/3 adds server-side saved items (today, saves for both go to browser `localStorage`, so gating generation behind login has no functional effect). `/api/health` and `/api/signup` are unauthenticated too (uptime monitor, marketing lead form). See `src/server/app.ts` for the mount order.

| Method | Path | Limiter | Schema | Handler |
|--------|------|---------|--------|---------|
| POST | `/api/auth/register` | authLimiter 5/min | RegisterSchema | `createAuthController().register` — creates user + workspace, sets cookie |
| POST | `/api/auth/login` | authLimiter 5/min | LoginSchema | `createAuthController().login` — verifies password, sets cookie |
| POST | `/api/auth/logout` | — | — | `createAuthController().logout` — clears cookie |
| GET | `/api/auth/me` | — | — (requireAuth) | `createAuthController().me` |
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
| POST | `/api/campaign/actuals` | 30/min | ActualsSchema | `createAnalyticsController().saveActuals` |
| POST | `/api/campaign/analysis` | 30/min | AnalysisSchema | `createAnalyticsController().analyze` |
| POST | `/api/campaign/analysis/explain` | 15/min | ExplainSchema | `createAnalyticsController().explain` |
| POST | `/api/signup` | 5/hr | SignupSchema | `createSignupController().signup` |
| GET | `/api/health` | — | — | `{ status: 'ok' }` |
| GET | `/privacy` | — | — | `public/privacy.html` |
| GET | `/terms` | — | — | `public/terms.html` |
| GET | `/generator.html` | — | — | 301 → `/campaign-generator.html` |

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
us → sweep, none, USD    mx/br → latam, none, USD
```

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
```

**Local dev without a real DB:** the server boots and non-DB routes (health, static pages, `/api/generate` if it didn't need auth) work fine with a placeholder `DATABASE_URL` — the Pool is only touched on an actual query (register/login/me). `DATABASE_URL` and `JWT_SECRET` are still required by `EnvSchema` even so (fail-fast on missing config, per existing project convention).

---

## Security

- **CSP**: `scriptSrc: ['self']` (no unsafe-inline — all JS external). `scriptSrcAttr: ['unsafe-inline']` for onclick handlers (pending addEventListener conversion).
- **Zod validation** on all API inputs before controller via `validate(schema)` middleware
- **Rate limiting** per endpoint class
- **requestId middleware**: `x-request-id` on every response
- **Auth (Phase 1, added 2026-07-02, guest-access revised 2026-07-02, code-review fixes 2026-07-03)**: email+password (bcrypt, 12 rounds), JWT in an httpOnly + Secure(prod/staging) + SameSite=Strict cookie (`_bt`, expiry synced to `JWT_EXPIRY` via `JWT_EXPIRY_MS` — see below). No roles/workspace-members/invites yet — 1 workspace per user, auto-created at registration (see `AUTH_IMPLEMENTATION_PLAN.md`).
  - Tool routes (`/api/generate`, `/api/campaign/*`, `/api/tournament/*`, `/api/loyalty/*`, `/api/reports/*`) use `optionalAuth`, **not** `requireAuth` — guests can generate/audit/optimize without an account. Only `/api/auth/me` is hard-gated.
  - Data persistence (moving `cfgSaved`/`be_campaigns`/`savedTournaments`/`savedLoyaltyPrograms`/`rc_campaigns`/`rc_templates` from localStorage to Postgres) is **not** done yet — that's Phase 2/3 of `AUTH_IMPLEMENTATION_PLAN.md`. Until then, guest and logged-in users save identically to browser `localStorage`; there is intentionally no login-gate on Save/Add-to-Calendar or on the Retention Calendar page. A landing→app login/register interstitial (with a "continue as guest" choice) was considered but deferred until Phase 2/3 actually makes the account/guest distinction functional.
  - **Email normalization**: `auth.schema.ts`'s `EmailSchema` does `.trim().toLowerCase()` before `.email()` — `users.email` has a plain case-sensitive Postgres `UNIQUE` constraint (no citext), so without this, differently-cased emails would create duplicate accounts and logins with a different case than registration would fail.
  - **`db/client.ts`**: `ssl: true` (not `{ rejectUnauthorized: false }`) for `sslmode=require` connection strings — Neon issues publicly-trusted certs, so full TLS chain validation works; disabling it would accept a MITM's self-signed cert. `pool.on('error', ...)` is registered (logs via `logger`) since an unhandled `'error'` on an idle pg client crashes the process.
  - **`Auth.ts registerUser`**: the pre-check `SELECT` for an existing email is a fast path, not a lock — a concurrent duplicate-email registration is caught by translating the Postgres unique-violation (`err.code === '23505'`) into the same 409 `EMAIL_TAKEN`, instead of letting it fall through as a generic 500.
  - **Cookie/token lifetime sync**: `src/domain/auth/jwt.ts` exports `JWT_EXPIRY_MS = ms(JWT_EXPIRY)` (the `ms` package — same parser `jsonwebtoken` uses internally for a string `expiresIn`); the auth cookie's `maxAge` uses this instead of a separately hardcoded constant, so changing `JWT_EXPIRY` can't desync the two.
  - **`requireAuth`/`optionalAuth`** both delegate to `authCookie.ts`'s `resolveUser(req)` — the cookie-read + JWT-verify + `req.user` mapping lives in one place.

**Error response shape**: `{ code: string, message: string }`.

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

**balance-solver.js** — `solveToTarget({ draft, levers, recalc, metricOf, target, constraints?, maxIter? })`: iterates over `levers` (enum swaps + multiplicative steps) until `metricOf(recalc(draft)) >= target` or all levers exhausted. `constraints` — optional array of `{ check(draft, cfg) → bool }` guards; a lever step is skipped if it would violate any constraint (used by bonus solver to enforce license wager/bonus caps). Returns `{ draft, reached }`.

**Parity tests** in `tests/domain/*.parity.test.js` assert identical output between JS modules and backend TypeScript for the same inputs. Run before shipping changes to either side.

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

---

## Pending work

**P0 (auth — `AUTH_IMPLEMENTATION_PLAN.md`, Phase 1 done, 2/3/4 remain):**
- Neon DB provisioned via Vercel Marketplace, `DATABASE_URL`/`JWT_SECRET`/`JWT_EXPIRY` set on the `bonus-generator` project (Production/Preview/Development) and pulled into local `.env`. `001_initial.sql` applied — `users`/`workspaces` exist. (Initially set up on the wrong project, `bonus-engine` — see Environments section — and fixed 2026-07-03.)
- Phase 2: `saved_configs`/`ai_campaigns`/`saved_tournaments`/`saved_loyalty_programs`/`calendar_events`/`calendar_templates` tables + CRUD routes — this is also the point where the account/guest distinction becomes functionally real (guests keep localStorage-only saves; accounts get durable Postgres saves)
- Phase 3: frontend repo-layers (configurator.js, campaign-generator.js, tournament-generator.js, loyalty-generator.js, retention-calendar/repository.js) switched from localStorage to the Phase-2 API
- Phase 4: one-time localStorage → API migration on first login + integration tests against a real/test DB
- Landing→app login/register interstitial with a "continue as guest" choice — designed but deliberately deferred until Phase 2/3 (see Security section); revisit then
- Header UI: show logged-in user's name + logout button (nav-utils.js) — not built yet

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

**P3 (frontend):**
- Convert `onclick=` handlers to `addEventListener` → remove `scriptSrcAttr: 'unsafe-inline'` from CSP

**P4 (post-auth):**
- AI response caching (Redis/KV)
- Queue for heavy generation (Bull/BullMQ)
- Rate limits per authenticated user
- OpenAPI from Zod schemas

---

## Completed work log

- ~~**Auth Phase 1 (core)**~~ — done 2026-07-02: `users`/`workspaces` tables + `001_initial.sql` (applied to a real Neon DB provisioned via Vercel Marketplace), bcrypt + JWT httpOnly-cookie auth, `authLimiter` 5/min, `login.html`/`register.html`. Verified end-to-end against the live DB (register → me → logout → login → wrong-password rejected).
- ~~**Auth guest access**~~ — done 2026-07-02, same day as Phase 1: reverted the initial "guard everything" decision. Tool routes (generate/campaign/tournament/loyalty/reports) switched from `requireAuth` to `optionalAuth` — guests can generate/audit/optimize freely. Removed `auth-guard.js` (401→redirect) since it no longer had anything to guard against. Rationale: saved items are still localStorage-only (Phase 2/3 not built), so gating generation behind login had no functional benefit and only added friction — see Security section.
- ~~**Auth code-review fixes**~~ — done 2026-07-03, from a full code-review of the unpushed auth+landing diff (8 finder agents + verify pass, see Security section for the list): fixed TLS cert validation (`ssl: true`, was `rejectUnauthorized: false`), email case-sensitivity (normalize via `auth.schema.ts`), a registration race condition (unique-violation → 409 instead of 500), cookie/JWT-expiry desync (`JWT_EXPIRY_MS` via the `ms` package). Added `pool.on('error', ...)`, closed a test-coverage gap (`tests/integration/api.guestAccess.test.js` — campaign/tournament/loyalty/reports guest access through the real `app.js`, not a bespoke express instance), and deduped `requireAuth`/`optionalAuth` (→ `authCookie.ts`'s `resolveUser`) and `login.js`/`register.js` (→ shared `auth-form.js` + `.auth-*` classes in `styles.css`).
- ~~**Unified Configurator**~~ — done: configurator.html + configurator.js (Bonus/Tournament/Loyalty), AI tabs, Economics panels, minD/maxWin overrides
- ~~**I4 (Loyalty AI)**~~ — done: missions endpoint, narratives, tier-link layer, persistence tests
- ~~**R3 (CG Basic/Expert toggle)**~~ — done: `cg_expert_mode` localStorage, VIP defaults to expert
- ~~**R4-B (Audit rule field)**~~ — done: `rule?: string` in AuditResponseSchema, buildAuditPrompt instruction, display in campaign-generator + tournament audit
- ~~**Economics UX clarity (tasks/ui-clarity-tooltips.md)**~~ — done 2026-06-22: currency fix (SITECUR_TO_USD), card subtitles, "Бонусная нагрузка" rename, scenario table columns, base segment row, abbreviation tooltips (LTV/ROI/RTP/вейджер), scenario dot layout, first-principles breakdown table (computeBonusBreakdown + renderBonusBreakdownTable), F1 nonlinear penalty + F2 effective value recalibration, ROI Платформы vs ROI Бонуса rename, MAX RISK top-level fix, factor table CSS grid alignment
