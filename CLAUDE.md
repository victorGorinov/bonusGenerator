# CLAUDE.md — Bonus Engine Configurator

Complete architecture reference for Claude Code sessions. Updated: 2026-05-17.

---

## Running the app

```bash
npm start            # Express on http://localhost:3000
PORT=8080 npm start  # custom port
npm test             # vitest run
npm run typecheck    # tsc --noEmit
```

No build step — `tsx` executes TypeScript directly. `public/` is served as static files.

Entry point: `server.ts` → imports `src/server/app.ts` → starts Express.

---

## Project structure

```
/
├── server.ts                        # Entry: loads dotenv, imports app, listens on PORT
├── src/
│   ├── server/app.ts                # Express app: helmet CSP, pino-http, routes, static, error middleware
│   ├── config/
│   │   ├── index.ts                 # Re-exports GEO map, PORT, ANTHROPIC_API_KEY, RESEND_API_KEY, NOTIFY_EMAIL
│   │   └── geo/
│   │       ├── index.ts             # GEO = { eu, cis, crypto, sweep, mn, latam }; also exports PORT, API keys
│   │       ├── eu.ts                # EU config + license overrides (ukgc, dga)
│   │       ├── cis.ts               # CIS (RU/KZ) config
│   │       ├── crypto.ts            # Global crypto config
│   │       ├── sweep.ts             # USA sweepstakes config
│   │       ├── mn.ts                # Mongolia config
│   │       └── latam.ts             # Latin America config
│   ├── domain/
│   │   ├── bonus/
│   │   │   ├── buildConfig.ts       # Pure function: params → full bonus config object
│   │   │   ├── recalcCosts.ts       # Pure function: cfg + overrides → { costs, ratio, maxRisk }
│   │   │   └── payout.ts            # truncNormalPayout: statistical bonus cost model
│   │   ├── campaign/
│   │   │   ├── scenarios.ts         # GEO_CFG, TONE_DESC, LANG_NAME, SEG_DESC, SCENARIO_MSG (RU+EN)
│   │   │   └── explanation.ts       # campaignExplanation(), campaignAlternatives() — text logic
│   │   └── ai/
│   │       └── parser.ts            # tryRepairJSON — JSON repair utility for AI responses
│   ├── ai/
│   │   ├── client.ts                # getAIClient() — singleton Anthropic SDK instance
│   │   ├── parser.ts                # parseTextsResponse(), parseAuditResponse() with Zod validation
│   │   └── prompts/
│   │       ├── texts.prompt.ts      # buildTextsPrompt() — CRM copy generation prompt
│   │       └── audit.prompt.ts      # buildAuditPrompt() — compliance audit prompt
│   ├── ai/providers/
│   │   └── anthropic.ts             # generate(prompt, opts) — calls claude-haiku-4-5, retries ×2
│   ├── controllers/
│   │   ├── generate.controller.ts   # POST /api/generate, POST /api/recalc
│   │   ├── campaign.controller.ts   # POST /api/campaign/generate, /texts, /audit
│   │   └── signup.controller.ts     # POST /api/signup (Resend email)
│   ├── services/
│   │   ├── bonus.service.ts         # Thin wrapper: calls buildConfig, recalcCosts
│   │   ├── campaign.service.ts      # generateCampaign(): maps geo+scenario → bonus config + explanations
│   │   └── ai.service.ts            # Re-exports generate from anthropic provider
│   ├── routes/
│   │   ├── generate.routes.ts       # POST /api/generate, /api/recalc (apiLimiter)
│   │   ├── campaign.routes.ts       # POST /api/campaign/* (campaignLimiter, aiLimiter)
│   │   ├── signup.routes.ts         # POST /api/signup (signupLimiter)
│   │   └── health.routes.ts         # GET /api/health
│   ├── middleware/
│   │   ├── rateLimiter.ts           # apiLimiter 30/min, campaignLimiter 20/min, aiLimiter 15/min, signupLimiter 5/hr
│   │   ├── validate.ts              # validate(schema) middleware — Zod parse, throws ValidationError
│   │   └── errors.ts                # errorMiddleware — maps AppError/ValidationError/AIProviderError to HTTP
│   ├── validation/
│   │   ├── generate.schema.ts       # GenerateSchema: region, players, sitecur, depcur, avgdep, plat, lic, rtp
│   │   ├── recalc.schema.ts         # RecalcSchema: cfg + overrides object
│   │   ├── campaign.schema.ts       # CampaignGenerateSchema: scenario + params (geo, segment, tone, etc.)
│   │   ├── texts.schema.ts          # TextsSchema — mechanic: .nullable().optional() (null allowed)
│   │   ├── audit.schema.ts          # AuditSchema: scenario, mechanic (.nullable().optional()), mechanicType, params, uiLang
│   │   └── signup.schema.ts         # SignupSchema: email, role, name
│   ├── errors/
│   │   ├── AppError.ts              # Base error with statusCode
│   │   ├── ValidationError.ts       # 400
│   │   └── AIProviderError.ts       # 502
│   └── utils/
│       └── logger.ts                # pino logger, pretty in dev
├── public/                          # Static files served by Express
│   ├── index.html                   # Landing page (EN/RU i18n, cookie consent, signup form)
│   ├── styles.css                   # Shared CSS
│   ├── configurator.html            # Bonus Configurator SPA (~1250 lines, loads app.js)
│   ├── app.js                       # Configurator frontend logic + i18n (RU/EN/MN/ES)
│   ├── campaign-generator.html      # AI Campaign Generator SPA (self-contained, no app.js)
│   ├── generator.html               # Legacy — redirected 301 → /campaign-generator.html
│   ├── privacy.html                 # Privacy Policy (EN/RU, GDPR)
│   └── terms.html                   # Terms of Service (EN/RU)
├── tests/
│   ├── domain/buildConfig.test.js
│   ├── domain/recalcCosts.test.js
│   ├── domain/payout.test.js
│   ├── ai/parser.test.js
│   └── integration/
│       ├── api.generate.test.js
│       └── security.headers.test.js
├── CLAUDE.md                        # This file
├── REFACTORING_PLAN.md              # 12-phase refactoring roadmap
├── FEATURE_EDIT_CAMPAIGN.md         # Edit campaign feature spec (fully implemented)
├── AI_CAMPAIGN_GENERATOR_PLAN.md    # AI Campaign Generator original spec
├── package.json                     # tsx runtime, no build step
├── tsconfig.json
├── vitest.config.js
└── vercel.json
```

---

## API routes

| Method | Path | Limiter | Schema | Handler |
|--------|------|---------|--------|---------|
| POST | `/api/generate` | 30/min | GenerateSchema | `generate.controller.generate` |
| POST | `/api/recalc` | 30/min | RecalcSchema | `generate.controller.recalc` |
| POST | `/api/campaign/generate` | 20/min | CampaignGenerateSchema | `campaign.controller.generate` |
| POST | `/api/campaign/texts` | 15/min | TextsSchema | `campaign.controller.texts` |
| POST | `/api/campaign/audit` | 15/min | AuditSchema | `campaign.controller.audit` |
| POST | `/api/signup` | 5/hr | SignupSchema | `signup.controller` |
| GET | `/api/health` | — | — | `{ status: 'ok' }` |
| GET | `/privacy` | — | — | `public/privacy.html` |
| GET | `/terms` | — | — | `public/terms.html` |
| GET | `/generator.html` | — | — | 301 → `/campaign-generator.html` |

---

## Core business logic

### `buildConfig(params)` — `src/domain/bonus/buildConfig.ts`

Pure function. Input: `{ region, lic, sitecur, depcur, players, avgdep, plat, rtp, riskAdj }`.

Returns full bonus config: `{ welcome, ndb, reload, dep2, dep3, wager, cashback, contrib, fsSpec, econ, reg, cur, r, pl, dep, lic }`.

**License override pattern** — for each section, `geo.licenses[lic]` values override base geo defaults:

```typescript
const licCfg    = (geo as Record<string, unknown>)['licenses'] as Record<string, Record<string, unknown>>;
const overrides = (licCfg?.[license]?.['welcome'] ?? {}) as Record<string, number>;
const maxBMax   = overrides['maxBMax'] ?? (w['maxBMax'] as number);
```

Active licenses: `mga` (EU default), `ukgc` (UK), `dga` (Denmark), `none` (CIS/latam/sweep/mn).

### `recalcCosts(cfg, overrides)` — `src/domain/bonus/recalcCosts.ts`

Pure function. Accepts full `cfg` object and flat overrides map (keys: `w_wager`, `w_maxB`, `w_mind`, `w_fs`, `w_pct`, `rl_pct`, `rl_wager`, `rl_maxB`, `rl_fs`, `d2_pct`, `d2_wager`, `d2_maxB`, `d2_fs`, `d3_pct`, `d3_wager`, `d3_maxB`, `d3_fs`, `ndb_wager`, `ndb_amt`, `ndb_fs`, `fs_wager`, `fs_count`).

Returns:
```typescript
{
  costs: { w_p10, w_p50, w_p90, ndb, rl, d2, d3, fs, total },
  // ALL values are TOTAL (already multiplied by pl — player count), not per-player
  ratio: number,    // cost ratio = w_p50 / (pl × dep)
  maxRisk: number   // theoretical max exposure = pl × bonus_size
}
```

Uses `truncNormalPayout` (payout.ts) for statistical modelling. P10 = optimistic, P50 = base, P90 = pessimistic.

### `econ` object (inside buildConfig output)

Key fields used in the frontend and recalc:
`arpu`, `cac`, `ltv3`, `roi`, `wagerX`, `costRatio`, `breakeven_wager`, `sP10.cost`, `sP50.cost`, `sP90.cost`, `mixedRTP`, `mixedWCR`.

---

## Geo config — `src/config/geo/`

### Region → file mapping

| Region key | File | Countries |
|---|---|---|
| `eu` | `eu.ts` | DE, DK, FR, ES, IT, NL, UK |
| `cis` | `cis.ts` | RU, KZ |
| `crypto` | `crypto.ts` | Global crypto |
| `sweep` | `sweep.ts` | US sweepstakes |
| `mn` | `mn.ts` | Mongolia |
| `latam` | `latam.ts` | MX, BR |

### Country → geo/license — `src/domain/campaign/scenarios.ts` (`GEO_CFG`)

```
de → region:eu, lic:mga,  EUR/EUR
dk → region:eu, lic:dga,  DKK/DKK   ← Denmark (Spillemyndigheden)
fr → region:eu, lic:mga,  EUR/EUR
es → region:eu, lic:mga,  EUR/EUR
it → region:eu, lic:mga,  EUR/EUR
nl → region:eu, lic:mga,  EUR/EUR
uk → region:eu, lic:ukgc, GBP/GBP
ru → region:cis, lic:none, RUB/RUB
kz → region:cis, lic:none, KZT/KZT
us → region:sweep, lic:none, USD/USD
mn → region:mn, lic:none, MNT/MNT
mx → region:latam, lic:none, USD/USD
br → region:latam, lic:none, USD/USD
```

### License override blocks — `src/config/geo/eu.ts`

`ukgc`: `maxB 200`, `wager 10x`, no FS on dep2/dep3, 6 regulatory strings.

`dga` (Denmark — Spillemyndigheden):
- `welcome.maxBMax: 1000` — statutory hard cap 1,000 DKK
- `ndb.days: 60` — statutory minimum validity
- `ndb.wager: 20`, `ndb.fs: 20`
- `wager.wW: 25` — market practice (range 10–35x)
- `wager.days: 60`
- `dep2.maxBMax: 750`, `dep3.maxBMax: 500`
- `reg: ['reg_dga_1', 'reg_dga_2', 'reg_dga_3', 'reg_dga_4']`
- ROFUS self-exclusion check required before any bonus award
- 2025 DGA update: T&Cs must appear in same font size as the promotional headline

---

## AI subsystem

### Model

`claude-haiku-4-5-20251001` — all AI calls. Retries ×2 with 300ms/600ms backoff.

Token budgets: texts → `maxTokens: 4096`, audit → `maxTokens: 900`.

### `buildTextsPrompt` — `src/ai/prompts/texts.prompt.ts`

Generates 3 variants per channel: push, email (subject+body), sms, telegram, popup.

Injects DGA compliance block when `lic === 'DGA'`:
- T&Cs same prominence as offer
- "Gælder for nye/eksisterende spillere"
- Stopspillet.dk reference
- 1,000 DKK cap explicitly stated in email and popup
- Wagering clearly disclosed
- 18+ and "Spil ansvarligt" in email footer

### `buildAuditPrompt` — `src/ai/prompts/audit.prompt.ts`

Audits 5 compliance aspects, returns checks + 2–4 recommendations.

Injects DGA rules block when `lic === 'DGA'`:
- 1,000 DKK hard cap
- 60-day minimum validity
- ROFUS check mandatory
- 2025 T&C font-size requirement
- 35x wagering ceiling
- Stopspillet.dk link requirement
- No bonus stacking

### AI response parsing

`src/ai/parser.ts`: strips markdown fences → `JSON.parse` → fallback `tryRepairJSON` → Zod schema validate → throws `AIProviderError` on failure.

Response schemas:
- `TextsResponseSchema`: `{ push[3], email[3]{subject,body}, sms[3], telegram[3], popup[3]{headline,subtext,cta} }`
- `AuditResponseSchema`: `{ checks[5]{label,status,note}, recommendations[2-4]{text,impact} }`

---

## Frontend

### `public/configurator.html` — Bonus Configurator SPA

~1250 lines HTML + inline JS. Loads `app.js`.

**Edit mode** (fully implemented, see `FEATURE_EDIT_CAMPAIGN.md`):

```javascript
window._editMode = { active: false, campaignId: null, originalCampaign: null }
```

Key functions:
- `_setEditMode(campaign)` — activates banner, sets state
- `_captureOverrides()` / `_applyOverrides(overrides)` — 23 override input IDs
- `_captureEconomics()` — reads from `_lastCfg.econ` or `_lastCfg._recalcCosts` (post-recalc)
- `renderAuditPanel()` — param diff, P10/P50/P90 before/after, cost ratio bar, recommendations, Save/Reset
- `updateSavedCampaign()` — persists params + economics + overrides to localStorage
- `resetToOriginal()` — reverts to original campaign overrides

**`patchFetchForRecalc()` IIFE** — intercepts `/api/recalc` responses, stores in `_lastCfg._recalcCosts` and `_lastCfg._recalcRatio`, triggers `renderAuditPanel()` when edit mode is active.

**Override input IDs**: `ov_w_wager`, `ov_w_maxB`, `ov_w_mind`, `ov_w_fs`, `ov_rl_pct`, `ov_rl_wager`, `ov_rl_maxB`, `ov_rl_fs`, `ov_d2_pct`, `ov_d2_wager`, `ov_d2_maxB`, `ov_d2_fs`, `ov_d3_pct`, `ov_d3_wager`, `ov_d3_maxB`, `ov_d3_fs`, `ov_ndb_wager`, `ov_ndb_amt`, `ov_ndb_fs`, `ov_w_pct`, `ov_fs_wager`, `ov_fs_count` (23 total).

**Campaign storage** (localStorage key `savedCampaigns`):
```javascript
{ id, name, params, mechanics, economics, overrides, createdAt, updatedAt }
```

### `public/app.js` — Configurator logic

- `LANG` dictionary — 4 languages: `ru`, `en`, `mn`, `es`
- `data-i18n="key"` + `setLang(code)` — swaps all UI text
- `generate()` → POST `/api/generate` → renders spec sheet
- `recalcEcon()` → POST `/api/recalc` → updates economics panel; triggers edit mode audit via fetch interceptor

### `public/campaign-generator.html` — AI Campaign Generator SPA

Fully self-contained (no app.js). All logic inline.

Key JS objects:
- `GEO_LBL` — country code → display label (13 countries)
- `GEO_LANG` — country code → default language (`dk:'da'`, `uk:'en'`, `ru:'ru'`, `de:'de'`, etc.)
- `S` — current session state

Supported languages: `da` (Danish), `de` (German), `en` (English), `ru` (Russian), `es` (Spanish), `mn` (Mongolian).

Key i18n helpers:
- `setUILang(lang)` — swaps all `data-i18n` text; must only reference DOM elements that exist **above** the `<script>` tag in source order (elements after `</script>` are not yet parsed)
- `localizedAlts(data)` — returns `data.alternativesEn` or `data.alternativesRu` based on `currentLang`; use instead of `data.alternatives` to get localized alternative mechanic cards

Flow: select geo → auto-set language → select scenario → `/api/campaign/generate` → optional `/api/campaign/texts` → optional `/api/campaign/audit` → save to localStorage.

### `public/index.html` — Landing page

EN/RU toggle. Signup form → `/api/signup`. Cookie consent banner (localStorage `cookieConsent`, 1.2s delay). Footer: `/privacy`, `/terms`.

### `public/privacy.html` + `public/terms.html`

Standalone pages, EN/RU toggle. Privacy: GDPR-compliant, localStorage-only, no analytics. Terms: professional use, 18+, compliance on operator, beta "as-is".

---

## Data flows

### Bonus Configurator

```
configurator.html
  → POST /api/generate { region, players, sitecur, depcur, avgdep, plat, lic, rtp, riskAdj }
  → validate(GenerateSchema) → generate.controller → bonus.service.buildConfig()
  → buildConfig.ts: GEO[region] + licenses[lic] overrides → config
  ← { welcome, ndb, reload, dep2, dep3, wager, cashback, contrib, fsSpec, econ, reg, cur }

Override input change → recalcEcon()
  → POST /api/recalc { cfg: _lastCfg, overrides: { w_wager, w_maxB, ... } }
  → recalcCosts(cfg, overrides)
  ← { costs: { w_p10, w_p50, w_p90, ... total }, ratio, maxRisk }
  patchFetchForRecalc() → _lastCfg._recalcCosts → renderAuditPanel()
```

### AI Campaign Generator

```
campaign-generator.html
  → POST /api/campaign/generate { scenario: {id, lbl}, params: {geo, segment, agg, games, risk, bonusTypes, lang, tone} }
  → campaign.service.generateCampaign()
  → GEO_CFG[geo] → {region, lic, sitecur, depcur}
  → buildConfig({...geoCfg, players, avgdep, plat:'both', rtp, riskAdj})
  → campaignExplanation(scenarioId, mechanicType, cfg, types, lang)
  ← { mechanic, mechanicType, selectedMechanics, allMechanics,
      explanation, explanationRu, explanationEn,
      alternatives, alternativesRu, alternativesEn,
      econ, wager, fsSpec, contrib, reg, cur, r }

  → POST /api/campaign/texts { scenario, mechanic, mechanicType, params }
  → buildTextsPrompt() [+ DGA block if lic=DGA]
  → aiGenerate(prompt, { maxTokens: 4096 }) → parseTextsResponse()
  ← { push[3], email[3], sms[3], telegram[3], popup[3] }

  → POST /api/campaign/audit { scenario, mechanic, mechanicType, params, uiLang }
  → buildAuditPrompt() [+ DGA rules if lic=DGA]
  → aiGenerate(prompt, { maxTokens: 900 }) → parseAuditResponse()
  ← { checks[5], recommendations[2-4] }
```

---

## Regulatory strings

`v_` prefix (e.g. `v_first_dep`, `v_slots_only`, `v_dga_max_bet`) and `reg_` prefix are i18n keys resolved in `app.js` at render time — NOT raw strings in API output.

Active `reg_` key sets: `reg_mga_1..5`, `reg_ukgc_1..6`, `reg_dga_1..4`.

**Note**: `v_dga_max_bet` and `reg_dga_*` i18n strings need to be added to `app.js` LANG dictionary (pending, see tech debt).

---

## Environments

| Branch | Vercel project | Purpose |
|--------|---------------|---------|
| `main` | `bonus-engine` | Production — auto-deploys on push |
| `stage` | `bonusengine-stage` | Staging — auto-deploys on push to `stage` |

Staging differs from production only in two env vars: `NOTIFY_EMAIL=victor.gorinov+stage@gmail.com` and `NODE_ENV=staging`.

When `NODE_ENV=staging` the app adds `X-Environment: staging` and `X-Robots-Tag: noindex` response headers (prevents search engine indexing). No functionality is blocked.

**Development workflow:**
```
feature/* → PR → stage → (test on staging URL) → PR → main → auto-deploy to prod
```

Staging env vars are in `.env.stage` (gitignored, reference template only). Set actual secrets in the Vercel dashboard for the `bonusengine-stage` project.

---

## Environment variables

```
ANTHROPIC_API_KEY=   # Required — AI endpoints
RESEND_API_KEY=      # Required — /api/signup email
NOTIFY_EMAIL=        # Default: victor.gorinov@gmail.com
PORT=3000            # Optional
NODE_ENV=staging     # Set on staging Vercel project only
```

---

## Security

- Helmet 8 CSP — **two separate directives matter**:
  - `scriptSrc: ["'unsafe-inline'"]` — allows `<script>...</script>` blocks
  - `scriptSrcAttr: ["'unsafe-inline'"]` — allows `onclick="..."` / `onload="..."` attribute handlers  
  Helmet 8 adds `script-src-attr 'none'` by **default**, silently blocking all inline event attributes even when `scriptSrc` is permissive. Both must be set explicitly until inline JS is extracted to external files (see P2 tech debt).
- Zod validation on all API inputs before controller
- Rate limiting per endpoint class (see rateLimiter.ts)
- No cookies — localStorage only (GDPR compliant)
- No analytics or third-party trackers
- Resend for transactional email only

### Error response shape

Backend error middleware returns `{ code: string, message: string }`. Frontend catches must read `err?.message || err?.error || String(err)` — **not** `err?.error` alone (which is undefined and causes `[object Object]` display).

---

## Tests

```bash
npm test  # vitest run
```

```
tests/domain/buildConfig.test.js          # snapshot + unit (regions, license overrides)
tests/domain/recalcCosts.test.js          # pure function
tests/domain/payout.test.js               # truncNormalPayout
tests/ai/parser.test.js                   # JSON repair + Zod validation
tests/integration/api.generate.test.js    # POST /api/generate
tests/integration/security.headers.test.js
```

---

## Known tech debt / pending work

See `REFACTORING_PLAN.md` for full 12-phase plan.

**Immediate (P0/P1):**
- `GenerateSchema.lic` still enumerates `['mga', 'ukgc', 'none']` — add `'dga'` to allow DK in the Configurator (currently only Campaign Generator uses it via GEO_CFG)
- Add `reg_dga_1..4` strings to `app.js` LANG dictionary (currently unresolved keys in Configurator)
- Add `v_dga_max_bet` i18n key to `app.js`
- Add `dk` country to `buildConfig.test.js` snapshot

**P2:**
- Move inline `<script>` blocks from HTML files to external `.js` files → then remove CSP `'unsafe-inline'` from both `scriptSrc` and `scriptSrcAttr`

**P3:**
- Test coverage for DGA license override path in buildConfig
- Test DK scenario in campaign.service integration test
