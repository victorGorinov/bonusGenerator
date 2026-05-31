# CLAUDE.md — Bonus Engine Configurator

Complete architecture reference for Claude Code sessions. Updated: 2026-05-31.

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
npm test             # vitest run (137 tests)
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
├── vite.config.ts                   # Frontend build: 4 JS entry points → public/dist/
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
│   │   │   └── calcEconomics.ts     # calcTournamentEconomics() — SEGMENT_RATIO × totalPlayers → eligible
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
│   │       └── tournament-audit.prompt.ts
│   ├── use-cases/
│   │   ├── GenerateBonusConfig.ts   # generateBonusConfig(), recalcBonusConfig()
│   │   ├── GenerateCampaign.ts      # generateCampaign(), texts, audit, optimize (inject AIProvider)
│   │   └── GenerateTournament.ts    # generateTournament(), texts, audit (inject AIProvider)
│   ├── controllers/                 # All use createXxxController(deps) factory pattern
│   │   ├── generate.controller.ts   # createGenerateController()
│   │   ├── campaign.controller.ts   # createCampaignController({ ai })
│   │   ├── tournament.controller.ts # createTournamentController({ ai })
│   │   └── signup.controller.ts     # createSignupController()
│   ├── services/
│   │   ├── bonus.service.ts         # generate(), recalc() — thin wrappers
│   │   ├── campaign.service.ts      # generateCampaign() — geo+scenario → config+explanations
│   │   └── tournament.service.ts    # generateTournament() — type+params → spec+econ
│   ├── routes/                      # Wire deps at startup: createXxxController({ ai: getAIProvider() })
│   │   ├── generate.routes.ts
│   │   ├── campaign.routes.ts
│   │   ├── tournament.routes.ts
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
│   │   ├── tournament.schema.ts     # TournamentGenerateSchema + Input types (Generate/Texts/Audit)
│   │   └── signup.schema.ts         # SignupSchema + SignupInput
│   └── errors/
│       ├── AppError.ts              # Base error with status + isOperational
│       ├── ValidationError.ts       # 400
│       └── AIProviderError.ts       # 502
├── public/                          # Static files served by Express
│   ├── index.html                   # Landing (EN/RU, all action btns yellow btn-gold, tools hub)
│   ├── styles.css                   # Configurator shared CSS
│   ├── app.js                       # Configurator logic + i18n (RU/EN/MN/ES) — external file
│   ├── configurator.html            # Bonus Configurator SPA (loads app.js + configurator-extra.js)
│   ├── configurator-extra.js        # Configurator page-specific JS (RTP sync, edit mode, etc.)
│   ├── campaign-generator.html      # AI Campaign Generator SPA (loads campaign-generator.js)
│   ├── campaign-generator.js        # Campaign Generator logic — extracted from HTML (2134 lines)
│   ├── tournament-generator.html    # Tournament Generator SPA (loads tournament-generator.js)
│   ├── tournament-generator.js      # Tournament Generator logic — extracted from HTML (983 lines)
│   ├── generator.html               # Legacy — 301 → /campaign-generator.html
│   ├── privacy.html                 # Privacy Policy (EN/RU)
│   └── terms.html                   # Terms of Service (EN/RU)
└── tests/
    ├── domain/buildConfig.test.js
    ├── domain/recalcCosts.test.js
    ├── domain/calcEconomics.test.js  # 20 tests
    ├── domain/payout.test.js
    ├── ai/parser.test.js
    └── integration/
        ├── api.generate.test.js
        └── security.headers.test.js  # Asserts script-src has NO unsafe-inline
```

---

## Backend architecture patterns (Phase 1–3 refactoring)

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

### Use-case layer — `src/use-cases/`

Thin seam between controllers and services. Controllers call use-cases; use-cases call services + AI. Designed to be thin now, expand when auth/billing arrives.

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

DGA (Denmark): `welcome.maxBMax: 1000 DKK`, `ndb.days: 60`, ROFUS check required.
UKGC: `maxB: 200 GBP`, `wager: 10x`, no FS on dep2/dep3, 6 regulatory strings.

---

## AI subsystem

**Model:** `claude-haiku-4-5-20251001` (constant `AI_MODEL` in `src/config/index.ts`)

**Token budgets:** texts → 4096, audit → 900, optimize → 1000

**Retry:** exp backoff + full jitter, max 2 retries; only 429/5xx/network errors retried.

**Cost logging:** `cost_usd` logged per call (input × $0.80/M + output × $4.00/M).

**Audit `rule` field:** each audit check includes a `rule` string citing the specific regulation (e.g. `"DGA – Spillemyndigheden bonus cap DKK 1,000"`). Field is optional in schema for backward compat.

**Response schemas** (`src/ai/parser.ts`):
- `TextsResponseSchema`: `{ push[3], email[3]{subject,body}, sms[3], telegram[3], popup[3]{headline,subtext,cta} }`
- `AuditResponseSchema`: `{ checks[5]{label,status,note,rule?}, recommendations[2-4]{text,impact} }`
- `OptimizeResponseSchema`: `{ recommendations[1-5]{factor,param,current,target,reason,impact} }`

---

## Frontend

### CSP policy (`src/server/app.ts`)

- `scriptSrc: ["'self'"]` — all JS is now in external files; `'unsafe-inline'` removed
- `scriptSrcAttr: ["'unsafe-inline'"]` — needed for `onclick=` handlers until converted to `addEventListener`

### `public/index.html` — Landing page

EN/RU. All action buttons use `btn-gold` class (yellow). Nav has links to all 3 tools. Tools hub section (#tools) with 3 cards. Hero has two CTAs (Campaign Generator + Tournament Generator).

### `public/configurator.html` + `public/app.js` + `public/configurator-extra.js`

Bonus Configurator SPA. `app.js` = main configurator logic (i18n RU/EN/MN/ES). `configurator-extra.js` = page-specific code (RTP sync, edit mode, audit panel, incremental revenue).

Sidebar: purple sidebar matching CG/TG structure, 220px fixed. CSS in inline `<style>`.

**Edit mode**: `window._editMode`, `_setEditMode()`, `_captureOverrides()`, `renderAuditPanel()`.

**Incremental Revenue v2**: `_calcRetentionV2(cfg, overrideWager)` + `_buildIncrRevBody(cfg, v)`. Factor breakdown collapsible (`cfg_incr_expert` localStorage key). AI optimize button when `netIncr < 0`.

**Basic/Expert toggle**: NOT in Configurator (only in Campaign Generator Step 3).

### `public/campaign-generator.html` + `public/campaign-generator.js`

AI Campaign Generator SPA. JS logic in external `campaign-generator.js`.

Key state: `draft = { scenario, _step, params }`. Key functions: `startWizard()`, `goStep(n)`, `showView(name)`, `renderEconScenarios()`, `_toggleEconExpert()`.

**Basic/Expert toggle** (Step 3): `#econ-wrap[data-expert="0/1"]` controlled by `_toggleEconExpert()`. CSS in global `<style>` block. VIP segment defaults to expert (if no localStorage override). localStorage key: `cg_expert_mode`. i18n: `econ_show_analysis`, `econ_collapse`.

**Onboarding**: `showOnboarding()` shown on first load when `localStorage.cg_onboarding_done` not set.

**AI texts disclaimer**: blue banner above texts content ("AI draft — review before sending"). i18n key: `ai_draft_note`.

**Audit panel**: `auditHTML(data)` renders checks with `rule` sub-line + timestamp "Audited: DD Mon YYYY, HH:MM".

**Tournament link**: sidebar `<a href="/tournament-generator.html">`. Campaigns link: `href="/campaign-generator.html#campaigns"` (hash routing to campaigns view on load).

### `public/tournament-generator.html` + `public/tournament-generator.js`

Tournament Generator SPA. JS logic in external `tournament-generator.js`.

**Views**: `showView('list')`, `showView('detail', id)`, `showView('setup')`, `goStep(1–4)`.

**Save/library**: `savedTournaments` localStorage key. `saveTournament()`, `deleteTournament(id)`, `loadAndShowGuide(id)`, `loadAndRegenTexts(id)`. Nav badge `#nav-tourn-badge` shows count.

---

## Data flows

### Bonus Configurator
```
configurator.html + app.js + configurator-extra.js
  → POST /api/generate → createGenerateController().generate → GenerateBonusConfig use-case
  → buildConfig() → config
  ← { welcome, ndb, reload, dep2, dep3, wager, cashback, contrib, fsSpec, econ, reg, cur }

Override change → POST /api/recalc → recalcCosts() ← { costs, ratio, maxRisk }
```

### AI Campaign Generator
```
campaign-generator.html + campaign-generator.js
  → POST /api/campaign/generate → createCampaignController().generate → GenerateCampaign use-case
  → campaignService.generateCampaign() → buildConfig() + campaignExplanation()
  ← { mechanic, mechanicType, selectedMechanics, allMechanics, explanation*, alternatives*, econ, ... }

  → POST /api/campaign/texts → GenerateCampaign.generateCampaignTexts(input, ai)
  ← { push[3], email[3], sms[3], telegram[3], popup[3] }

  → POST /api/campaign/audit → GenerateCampaign.auditCampaign(input, ai)
  ← { checks[5]{label,status,note,rule?}, recommendations[2-4] }

  → POST /api/campaign/optimize → GenerateCampaign.optimizeCampaign(input, ai)
  ← { recommendations[2-4]{factor,param,current,target,reason,impact} }
```

### Tournament Generator
```
tournament-generator.html + tournament-generator.js
  → POST /api/tournament/generate { type, params: { ..., totalPlayers, segment, ... } }
  → createTournamentController().generate → GenerateTournament use-case
  → tournamentService.generateTournament() → calcTournamentEconomics({ totalPlayers, segment, ... })
    eligible = round(totalPlayers × SEGMENT_RATIO[segment])
    SEGMENT_RATIO: { all:1.0, new:0.20, vip:0.10, dormant:0.40, depositors:0.60 }
  ← { spec, econ: { totalPlayers, segmentRatio, eligible, ... }, params, cur, region, lic }

  → POST /api/tournament/texts / /audit → GenerateTournament use-case + AI
```

**Step 2 UI**: slider "Total Active Players" (100–100,000, default 5,000). Live hint shows eligible count (e.g. "500 VIP players eligible"). Eligible recalculates on both slider move and segment chip click.

**Step 3 footnote**: `"500 eligible vip players (10% of 5,000 total casino players) · ARPU 65 USD/mo · engagement ×2.5"`

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

```
incrPl    = round(pl × lift)
incrRev   = incrPl × ltv3                    // USD
campCost3 = 3 × costRatio × pl × arpu        // USD (currency-safe)
net       = incrRev − campCost3
```

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
- No analytics or third-party trackers

**Error response shape**: `{ code: string, message: string }`. Frontend: read `err?.message || String(err)`.

---

## Tests

```bash
npm test             # 137 tests, 7 files
npm run test:watch   # vitest watch mode
```

```
tests/domain/buildConfig.test.js
tests/domain/recalcCosts.test.js
tests/domain/calcEconomics.test.js   # 25 tests (includes totalPlayers/segmentRatio coverage)
tests/domain/payout.test.js
tests/ai/parser.test.js
tests/integration/api.generate.test.js
tests/integration/security.headers.test.js  # CSP assertions
```

**MockAIProvider** (`src/ai/providers/mock.ts`): inject via `setAIProvider(new MockAIProvider([...]))` or `createCampaignController({ ai: new MockAIProvider([...]) })`.

---

## Pending work

**P1 (tests):**
- Add DK snapshot to `buildConfig.test.js`
- Add RU/KZ/MN snapshots for payout fallback path coverage

**P2 (UX — from UX_DEV_PLAN.md, R5–R8 pending):**
- R5: Model assumptions collapsible block + tooltip coverage audit
- R6: Stale econ indicator in Configurator (params changed after Generate)
- R7: Glossary panel in CG + Configurator topbar
- R8: Copy-all channel button + PDF export (campaign + tournament + audit)

**P2 (features):**
- Task A: Projected result per AI recommendation (apply param-change to 5-factor formula, show lift delta)
- Task B: AI campaign review button when `netIncr > 0` (`mode:'review'` in optimize prompt)

**P3 (frontend):**
- Convert `onclick=` handlers to `addEventListener` → remove `scriptSrcAttr: 'unsafe-inline'` from CSP
- Vite production build referenced from HTML files (currently built to `public/dist/` but HTML still loads raw JS)

**P4 (post-auth — see REFACTORING_PLAN.md):**
- AI response caching (Redis/KV)
- Queue for heavy generation (Bull/BullMQ)
- Rate limits per authenticated user
- OpenAPI from Zod schemas
