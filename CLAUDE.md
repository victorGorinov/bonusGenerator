# CLAUDE.md — Retomat: Retention OS for iGaming

Complete architecture reference for Claude Code sessions. Updated: 2026-06-02.

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
npm test             # vitest run (393 tests, 28 files)
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
│   │   ├── index.ts                 # Zod EnvSchema (fail-fast), ENV, PORT, API keys, AI_MODEL, AI_TIMEOUT
│   │   └── geo/                     # eu.ts, cis.ts, crypto.ts, sweep.ts, mn.ts, latam.ts
│   ├── domain/
│   │   ├── shared/
│   │   │   ├── Segment.ts           # 'new'|'mid'|'vip' + isSegment()
│   │   │   ├── Region.ts            # 'eu'|'cis'|... + isRegion()
│   │   │   └── Currency.ts          # CurrencyCode type + isCurrencyCode()
│   │   ├── bonus/
│   │   │   ├── buildConfig.ts       # Pure: params → full bonus config
│   │   │   ├── recalcCosts.ts       # Pure: cfg + overrides → { costs, ratio, maxRisk }
│   │   │   └── payout.ts            # truncNormalPayout: statistical cost model
│   │   ├── campaign/
│   │   │   ├── scenarios.ts         # GEO_CFG, LANG_NAME, SEG_DESC, SCENARIO_MSG
│   │   │   └── explanation.ts       # campaignExplanation(), campaignAlternatives()
│   │   ├── tournament/
│   │   │   ├── calcEconomics.ts     # calcTournamentEconomics() — SEGMENT_RATIO × totalPlayers → eligible
│   │   │   └── benchmarks.ts        # tournamentBenchmarks() — deterministic realism checks
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
│   │   ├── GenerateBonusConfig.ts   # generateBonusConfig(), recalcBonusConfig()
│   │   ├── GenerateCampaign.ts      # generateCampaign(), texts, audit, optimize (inject AIProvider)
│   │   ├── GenerateTournament.ts    # generateTournament(), texts, audit, optimize (inject AIProvider)
│   │   └── GenerateLoyalty.ts       # generateLoyaltyConfig(), recalcLoyaltyConfig()
│   ├── controllers/                 # All use createXxxController(deps) factory pattern
│   │   ├── generate.controller.ts   # createGenerateController()
│   │   ├── campaign.controller.ts   # createCampaignController({ ai })
│   │   ├── tournament.controller.ts # createTournamentController({ ai })
│   │   ├── loyalty.controller.ts    # createLoyaltyController() — no AI dep (pure domain)
│   │   └── signup.controller.ts     # createSignupController()
│   ├── services/
│   │   ├── bonus.service.ts         # generate(), recalc() — thin wrappers
│   │   ├── campaign.service.ts      # generateCampaign() — geo+scenario → config+explanations
│   │   ├── tournament.service.ts    # generateTournament() — type+params → spec+econ
│   │   └── loyalty.service.ts       # generate() → buildLoyaltyConfig + calcLoyaltyEconomics
│   ├── routes/                      # Wire deps at startup: createXxxController({ ai: getAIProvider() })
│   │   ├── generate.routes.ts
│   │   ├── campaign.routes.ts
│   │   ├── tournament.routes.ts
│   │   ├── loyalty.routes.ts        # POST /api/loyalty/generate (20/min) + /recalc (30/min)
│   │   ├── signup.routes.ts
│   │   └── health.routes.ts
│   ├── middleware/
│   │   ├── asyncHandler.ts          # asyncHandler<P,R,B>(fn) — eliminates try/catch in controllers
│   │   ├── requestId.ts             # x-request-id on every response; augments Express.Request
│   │   ├── rateLimiter.ts           # apiLimiter 30/min, campaignLimiter 20/min, aiLimiter 15/min
│   │   ├── validate.ts              # validate(schema) — Zod parse, throws ValidationError
│   │   └── errors.ts                # errorMiddleware — AppError/ValidationError/AIProviderError → HTTP
│   ├── validation/                  # All schemas export z.infer<> types
│   │   ├── generate.schema.ts       # GenerateSchema + GenerateInput
│   │   ├── recalc.schema.ts         # RecalcSchema + RecalcInput
│   │   ├── campaign.schema.ts       # CampaignGenerateSchema + CampaignGenerateInput
│   │   ├── texts.schema.ts          # TextsSchema + TextsInput
│   │   ├── audit.schema.ts          # AuditSchema + AuditInput
│   │   ├── optimize.schema.ts       # OptimizeSchema + OptimizeInput
│   │   ├── tournament.schema.ts     # TournamentGenerateSchema + Input types (Generate/Texts/Audit/Optimize)
│   │   ├── loyalty.schema.ts        # LoyaltyGenerateSchema + LoyaltyRecalcSchema + Input types
│   │   └── signup.schema.ts         # SignupSchema + SignupInput
│   └── errors/
│       ├── AppError.ts              # Base error with status + isOperational
│       ├── ValidationError.ts       # 400
│       └── AIProviderError.ts       # 502
├── public/                          # Static files served by Express
│   ├── index.html                   # Landing — Retention OS positioning (EN/RU), calendar-first
│   ├── index.js                     # Landing i18n (EN/RU) + particles + sticky CTA
│   ├── styles.css                   # Configurator shared CSS
│   ├── app.js                       # Configurator logic + i18n (RU/EN/MN/ES) — external file
│   ├── nav-utils.js                 # Shared across all pages: updateAllBadges(), applyNavLang(), initNavSubgroups()
│   ├── balance-solver.js            # solveToTarget() — generic parameter solver for Balance-to-Profit
│   ├── bonus-cost.js                # Client-side bonus cost model (parity with backend recalcCosts)
│   ├── loyalty-econ.js              # Client-side loyalty economics (parity with backend calcLoyaltyEconomics)
│   ├── tournament-econ.js           # Client-side tournament economics (parity with backend calcTournamentEconomics)
│   ├── configurator.html            # Bonus Configurator SPA (loads app.js + configurator-extra.js)
│   ├── configurator-extra.js        # Configurator page-specific JS (RTP sync, edit mode, audit panel, balance)
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
    ├── domain/tournament.balance.test.js         # tournament balance-solver tests
    ├── domain/tournament.econ.parity.test.js     # tournament-econ.js ↔ backend parity
    ├── domain/balance.solver.test.js             # balance-solver.js unit tests
    ├── domain/bonus.cost.parity.test.js          # bonus-cost.js ↔ backend recalcCosts parity
    ├── domain/bonus.parseRecTarget.test.js       # parseRecTarget() edge cases
    ├── domain/bonus.solver.constraints.test.js   # solver constraint bounds tests
    └── integration/
        ├── api.generate.test.js
        ├── api.loyalty.test.js                   # 11 tests
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

| Method | Path | Limiter | Schema | Handler |
|--------|------|---------|--------|---------|
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

### `recalcCosts(cfg, overrides)` — `src/domain/bonus/recalcCosts.ts`

Returns `{ costs: { w_p10, w_p50, w_p90, ndb, rl, d2, d3, fs, total }, ratio, maxRisk }`.
All cost values are TOTAL (already multiplied by `pl`). `ratio = w_p50 / (pl × dep)`.

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

### `public/configurator.html` + `public/app.js` + `public/configurator-extra.js`

Bonus Configurator SPA. `app.js` = main logic (i18n RU/EN/MN/ES). `configurator-extra.js` = RTP sync, edit mode, audit panel, incremental revenue.

**Edit mode**: `window._editMode`, `_setEditMode()`, `_captureOverrides()`, `renderAuditPanel()`.

**Incremental Revenue v2**: `_calcRetentionV2(cfg, overrideWager)` + `_buildIncrRevBody(cfg, v)`.

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
- Step 3 — Results: API call to `/api/loyalty/generate` → economics grid (6 cards) + tier table + mission list; Save + Add to Calendar buttons; AI stubs (disabled, I4)

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

**State:** `rc_campaigns` + `rc_templates` localStorage keys.

---

## Data flows

### Bonus Configurator
```
configurator.html + app.js + configurator-extra.js
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

---

## Incremental Revenue v2 — model reference

```
lift = min(0.40, base × F1 × F2 × F3 × F4 × F5)
```

| Factor | Formula | Notes |
|--------|---------|-------|
| Base | `SEG_LIFT[seg]` | new=0.25, mid=0.18, vip=0.12 |
| F1 Wager | `clamp(0.7 + 0.3 × clamp(beW/wagerX, 0.3, 2.0), 0.65, 1.35)` | >1 when beW>wagerX |
| F2 Generosity | `clamp(0.85 + 0.30 × min(matchPct/100, 1.0), 0.85, 1.15)` | neutral at 50% match |
| F3 Mechanics | `1 + NDB×0.06 + RL×0.08 + D2×0.04 + FS×0.04 + CB×0.07` | max ≈ 1.29 |
| F4 RTP | `clamp(0.94 + 0.12 × ((rtp−0.85)/0.14), 0.94, 1.06)` | range 85–99% |
| F5 Platform | `{ mobile:1.05, desk:0.97, both:1.0 }` | — |

---

## Regulatory strings

`v_` prefix and `reg_` prefix are i18n keys resolved in `app.js` at render time — NOT raw strings in API output.

Active `reg_` key sets: `reg_mga_1..5`, `reg_ukgc_1..6`, `reg_dga_1..4`.

---

## Environments

| Branch | Vercel project | Purpose |
|--------|---------------|---------|
| `main` | `bonus-engine` | Production — auto-deploys on push |
| `stage` | `bonusengine-stage` | Staging — auto-deploys on push to `stage` |

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
```

---

## Security

- **CSP**: `scriptSrc: ['self']` (no unsafe-inline — all JS external). `scriptSrcAttr: ['unsafe-inline']` for onclick handlers (pending addEventListener conversion).
- **Zod validation** on all API inputs before controller via `validate(schema)` middleware
- **Rate limiting** per endpoint class
- **requestId middleware**: `x-request-id` on every response
- No cookies — localStorage only (GDPR)

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

---

## Client-side economics modules

Four browser-side JS modules mirror backend domain logic for real-time recalculation without API round-trips:

| File | Mirrors | Used by |
|------|---------|---------|
| `public/bonus-cost.js` | `src/domain/bonus/recalcCosts.ts` | configurator-extra.js |
| `public/loyalty-econ.js` | `src/domain/loyalty/calcEconomics.ts` | loyalty-generator.js |
| `public/tournament-econ.js` | `src/domain/tournament/calcEconomics.ts` | tournament-generator.js |
| `public/balance-solver.js` | — (generic solver) | tournament/loyalty/configurator |

**balance-solver.js** — `solveToTarget({ draft, levers, recalc, metricOf, target })`: iterates over `levers` (enum swaps + multiplicative steps) until `metricOf(recalc(draft)) >= target` or all levers exhausted. Returns `{ draft, reached }`.

**Parity tests** in `tests/domain/*.parity.test.js` assert identical output between JS modules and backend TypeScript for the same inputs. Run before shipping changes to either side.

---

## Pending work

**P1 (tests):**
- Add DK snapshot to `buildConfig.test.js`
- Add RU/KZ/MN snapshots for payout fallback path coverage

**P2 (UX):**
- R5: Model assumptions collapsible block + tooltip coverage audit
- R6: Stale econ indicator in Configurator (params changed after Generate)
- R7: Glossary panel in CG + Configurator topbar
- R8: Copy-all channel button + PDF export (campaign + tournament + audit)

**P2 (features):**
- Task A: Projected result per AI recommendation (apply param-change to 5-factor formula, show lift delta)
- Retention Calendar: read `?rcDate=` query param in tournament-generator.js to pre-fill date from calendar redirect
- **I4 (Loyalty AI):** texts/audit/optimize endpoints + prompts + parser schemas + mock tests; unlock AI buttons in loyalty-generator.js

**P3 (frontend):**
- Convert `onclick=` handlers to `addEventListener` → remove `scriptSrcAttr: 'unsafe-inline'` from CSP

**P4 (post-auth):**
- AI response caching (Redis/KV)
- Queue for heavy generation (Bull/BullMQ)
- Rate limits per authenticated user
- OpenAPI from Zod schemas
