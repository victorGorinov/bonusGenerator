# CLAUDE.md — Bonus Engine Configurator

Complete architecture reference for Claude Code sessions. Updated: 2026-05-21.

---

## Session rules

**ОБЯЗАТЕЛЬНО перед любым кодингом** — запросить явное подтверждение у пользователя.

Порядок работы:
1. Проанализировать задачу, описать план (что и где будет изменено).
2. Дождаться явного "да" / "go" / "реализуй" от пользователя.
3. Только после подтверждения начинать вносить изменения в файлы.

Это правило действует всегда — даже если задача очевидна, хорошо задокументирована или была подтверждена в предыдущей сессии.

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
│   │   ├── tournament/
│   │   │   └── calcEconomics.ts     # calcTournamentEconomics() — pure economics for tournaments
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
│   │   ├── campaign.controller.ts   # POST /api/campaign/generate, /texts, /audit, /optimize
│   │   ├── tournament.controller.ts # POST /api/tournament/generate, /texts, /audit
│   │   └── signup.controller.ts     # POST /api/signup (Resend email)
│   ├── services/
│   │   ├── bonus.service.ts         # Thin wrapper: calls buildConfig, recalcCosts
│   │   ├── campaign.service.ts      # generateCampaign(): maps geo+scenario → bonus config + explanations
│   │   ├── tournament.service.ts    # generateTournament(): maps type+params → spec+econ+prize distribution
│   │   └── ai.service.ts            # Re-exports generate from anthropic provider
│   ├── routes/
│   │   ├── generate.routes.ts       # POST /api/generate, /api/recalc (apiLimiter)
│   │   ├── campaign.routes.ts       # POST /api/campaign/* (campaignLimiter, aiLimiter)
│   │   ├── tournament.routes.ts     # POST /api/tournament/* (campaignLimiter, aiLimiter)
│   │   ├── signup.routes.ts         # POST /api/signup (signupLimiter)
│   │   └── health.routes.ts         # GET /api/health
│   ├── middleware/
│   │   ├── rateLimiter.ts           # apiLimiter 30/min, campaignLimiter 20/min, aiLimiter 15/min, signupLimiter 5/hr
│   │   ├── validate.ts              # validate(schema) middleware — Zod parse, throws ValidationError
│   │   └── errors.ts                # errorMiddleware — maps AppError/ValidationError/AIProviderError to HTTP
│   ├── validation/
│   │   ├── generate.schema.ts       # GenerateSchema: region, players, sitecur, depcur, avgdep, plat, lic, rtp, segment (optional)
│   │   ├── recalc.schema.ts         # RecalcSchema: cfg + overrides object
│   │   ├── campaign.schema.ts       # CampaignGenerateSchema: scenario + params (geo, segment, tone, etc.)
│   │   ├── texts.schema.ts          # TextsSchema — mechanic: .nullable().optional() (null allowed)
│   │   ├── audit.schema.ts          # AuditSchema: scenario, mechanic (.nullable().optional()), mechanicType, params, uiLang
│   │   ├── optimize.schema.ts       # OptimizeSchema: geo, segment, lift object, economics object
│   │   ├── tournament.schema.ts     # TournamentGenerateSchema, TournamentTextsSchema, TournamentAuditSchema
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
│   ├── tournament-generator.html    # Tournament Generator SPA — 4-step wizard (self-contained)
│   ├── generator.html               # Legacy — redirected 301 → /campaign-generator.html
│   ├── privacy.html                 # Privacy Policy (EN/RU, GDPR)
│   └── terms.html                   # Terms of Service (EN/RU)
├── tests/
│   ├── domain/buildConfig.test.js
│   ├── domain/recalcCosts.test.js
│   ├── domain/calcEconomics.test.js  # Tournament economics — 20 tests
│   ├── domain/payout.test.js
│   ├── ai/parser.test.js
│   └── integration/
│       ├── api.generate.test.js
│       └── security.headers.test.js
├── CLAUDE.md                        # This file
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
| POST | `/api/campaign/optimize` | 15/min | OptimizeSchema | `campaign.controller.optimize` |
| POST | `/api/tournament/generate` | 20/min | TournamentGenerateSchema | `tournament.controller.generate` |
| POST | `/api/tournament/texts` | 15/min | TournamentTextsSchema | `tournament.controller.texts` |
| POST | `/api/tournament/audit` | 15/min | TournamentAuditSchema | `tournament.controller.audit` |
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

**CIS config note** (`src/config/geo/cis.ts`) — `reload.maxBMax` is `Infinity` (not an absolute cap). The bonus ceiling is enforced exclusively via `maxBMulti: 1.5` (1.5× avgdep), which is currency-agnostic. An earlier absolute cap of 200 RUB was incorrect and has been removed.

**`calcScenario` payout fallback** — `truncNormalPayout` is not scale-invariant. For large-denomination currencies (RUB, KZT, MNT) z = mu/sigma falls in the range −20 to −43, causing a floating-point problem: `_Phi(z)` (computed via `_erf`) underflows to exactly 0, while `_phi(z)` (computed as `exp(-z²/2)/√(2π)`) remains representable as a tiny positive. This leaves a spurious `payoutStat` like `1.8e-200` that passes `payoutStat > 0` but rounds to 0 in the final cost. Fix: use a relative threshold — if `payoutStat < bonusSize × 1e-6` it is a numerical artifact; fall back to the deterministic breakeven-efficiency estimate:

```typescript
const payoutStat = truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP);
const adjBe  = adjWCR / (1 - adjRTP);
const adjEff = wagerX > 0 ? Math.min(1, adjBe / Math.max(adjBe, wagerX)) : 1;
const payout = payoutStat > bonusSize * 1e-6 ? payoutStat : bonusSize * adjEff;
```

EUR/GBP/USD geos unaffected (their `payoutStat` is in the range of the bonus size, far above the threshold). Sweep geos (wagerX=0) get `adjEff=1` (full bonus passes through). MN sP10 (z≈-43) underflows completely to 0; sP50/sP90 (z≈-30 to -23) hit the spurious-tiny-positive range — all three now correctly use the fallback.

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
`arpu`, `cac`, `bpct`, `ltv3`, `mBudget`, `roi3`, `be`, `wagerX`, `costRatio`, `breakeven_wager`, `bonusSize`, `sP10`, `sP50`, `sP90`, `mixedRTP`, `mixedWCR`, `pl`, `dep`.

- `arpu` — average revenue per user per month, **USD** (from geo config; e.g. EU=65, CIS=22, MN=12)
- `cac` — customer acquisition cost per player, **USD** (e.g. EU=25, CIS=8, MN=5)
- `bpct` — bonus cost as % of GGR (e.g. 22 for MN = 22%)
- `mBudget` — `pl × cac`, total monthly marketing benchmark budget, **USD**
- `ltv3` — `arpu × 3`, 3-month LTV per player, **USD**
- `dep` — `avgdep` in **sitecur** (local currency)
- `costRatio` — `totalBonusCost / (pl × dep)`, dimensionless ratio of bonus payouts to deposit volume
- `bonusSize` — calculated welcome bonus size in sitecur

Each `sP{n}` object: `{ conv, wcr, rtp, turnover, payout, cost }`. `conv` is the conversion rate (0.10/0.20/0.40 for P10/P50/P90). `cost` is TOTAL campaign cost (already multiplied by `pl`), **in sitecur**. After the 2026-05-19 fix, `sP{n}.cost` is always non-zero for any geo with a real bonus (including RU/KZ/MN).

**Currency note** — `arpu`, `cac`, `ltv3`, `mBudget` are in **USD** (geo config benchmarks). `dep`, `sP{n}.cost`, `bonusSize` are in **sitecur** (local currency). Do not mix them without conversion.

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
dk → region:eu, lic:dga,  DKK/DKK   ← avgdep: new=300 / mid=700 / vip=3500 DKK
fr → region:eu, lic:mga,  EUR/EUR
es → region:eu, lic:mga,  EUR/EUR
it → region:eu, lic:mga,  EUR/EUR
nl → region:eu, lic:mga,  EUR/EUR
uk → region:eu, lic:ukgc, GBP/GBP
ru → region:cis, lic:none, RUB/RUB   ← avgdep: new=2000 / mid=5000 / vip=25000 RUB
kz → region:cis, lic:none, KZT/KZT   ← avgdep: new=8000 / mid=20000 / vip=100000 KZT
us → region:sweep, lic:none, USD/USD
mn → region:mn,  lic:none, MNT/MNT   ← avgdep: new=40000 / mid=100000 / vip=500000 MNT
mx → region:latam, lic:none, USD/USD
br → region:latam, lic:none, USD/USD
```

`GEO_CFG` type includes optional `avgdep?: { new: number; mid: number; vip: number }`. Geos without this field (EUR/GBP/USD) fall back to `BASE_AVGDEP = { new: 40, mid: 100, vip: 500 }` in `campaign.service.ts`. The per-segment avgdep is resolved as:

```typescript
const BASE_AVGDEP = { new: 40, mid: 100, vip: 500 };
const segAvgdep = geoCfg.avgdep ?? BASE_AVGDEP;
const avgdep = segAvgdep[seg] ?? BASE_AVGDEP[seg] ?? 100;
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

**EU Country Picker** — shown only when `region=eu` is selected. 7 country chips: DE / FR / ES / IT / NL / UK / DK. Selecting a country calls `pickCountry(chip)` which sets `sitecur`, `depcur`, `lic`, and `avgdep` from `EU_COUNTRY` map (in `app.js`) and updates the license chip selection automatically. Hint text below the picker (`eu-country-hint`) shows the resolved license + currency + avg deposit for the selected country.

**License chip selector** — chips: `mga / ukgc / dga / curacao / anjouan / kahnawake / gibraltar / isle_of_man / none`. DGA chip added (2026-05-19). Default chip depends on selected EU country; auto-set by `pickCountry()`.

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

**`EU_COUNTRY` map** — `{ de, fr, es, it, nl, uk, dk }` each with `{ lic, sitecur, depcur, avgdep }`. Used by `pickCountry()` in `configurator.html` to auto-fill form fields when a country chip is selected:
```javascript
const EU_COUNTRY = {
  de: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:50  },
  fr: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:45  },
  es: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:40  },
  it: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:40  },
  nl: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:55  },
  uk: { lic:'ukgc', sitecur:'GBP', depcur:'GBP', avgdep:45  },
  dk: { lic:'dga',  sitecur:'DKK', depcur:'DKK', avgdep:700 },
};
```

**i18n keys added (2026-05-19):**
- `v_eu_max_bet`, `v_ukgc_max_bet`, `v_dga_max_bet`, `v_standard_max_bet` — max bet labels (all 4 languages)
- `reg_dga_1..4` — DGA regulatory strings (RU + EN)
- `reg_curacao_1..2`, `reg_anjouan_1`, `reg_kahnawake_1`, `reg_gibraltar_1`, `reg_iom_1` — global license strings
- `sec_cg_econ`, `sec_mech_exp`, `sec_cfg_audit` — section titles for Configurator panels
- `btn_run_cfg_audit`, `cfg_audit_running`, `cfg_audit_pass`, `cfg_audit_fail`, `cfg_audit_warn`, `cfg_audit_impact`, `cfg_audit_recs`, `cfg_audit_not_run`, `cfg_audit_error` — AI compliance audit UI
- `cg_best`, `cg_expected`, `cg_worst`, `cg_cost_per_bonus`, `cg_dep_load`, `cg_wager_compl` — economics panel labels
- `rtip_cg_cpb`, `rtip_cg_dl`, `rtip_cg_wc` — tooltip hint texts for econ metrics
- `mech_exp_welcome`, `mech_exp_ndb`, `mech_exp_reload`, `mech_exp_below_be`, `mech_exp_above_be` — mechanic explanation labels

**i18n keys added (2026-05-20) — Segment + Incremental Revenue v2:**
- `lbl_segment`, `tip_segment` — segment field label and tooltip (all 4 languages)
- `seg_new`, `seg_mid`, `seg_vip` — segment chip labels (🆕 / 👤 / 👑)
- `sec_incr_rev` — "Прогноз Incremental Revenue" section header
- `p_ret_lift`, `p_incr_players`, `p_incr_rev`, `p_camp_cost_3`, `p_incr_net` — metric row labels
- `rtip_ret_lift`, `rtip_incr_rev`, `rtip_incr_net` — tooltip texts for incremental metrics
- `incr_disclaimer` — disclaimer footer text
- `incr_base`, `incr_f_wager`, `incr_f_gen`, `incr_f_mech`, `incr_f_rtp`, `incr_f_plat`, `incr_lift_total` — factor breakdown labels

**Segment picker — Configurator (`configurator.html`)**

Added before the Platform field in the configuration form:
```html
<div class="chips">
  <div class="chip" data-g="segment" data-v="new" onclick="pickChip(this)">🆕 Новые</div>
  <div class="chip on" data-g="segment" data-v="mid" onclick="pickChip(this)">👤 Средние</div>
  <div class="chip" data-g="segment" data-v="vip" onclick="pickChip(this)">👑 VIP</div>
</div>
```

`pickChip(el)` uses `S[g] = el.dataset.v` generically — no extra code needed. Default: `mid`. State: `S.segment`. Sent to `/api/generate` as `segment: S.segment || 'mid'`. Also stored in `savedCampaigns` localStorage entry. Restored in `_applyParamsFromCampaign` via `setChip('segment', p.segment)`.

**Incremental Revenue v2 — Configurator (`app.js`)**

Two new functions added before `render(c)`:

`_calcRetentionV2(cfg, overrideWager)` — computes all 5 lift factors from the full config object:
```javascript
// Returns: { base, wagFactor, genFactor, mechFactor, rtpFactor, platFactor, lift,
//            wagerX, beW, matchPct, hasNDB, hasReload, hasDep2, hasFS, hasCB, rtp, plat, seg }
```

`_buildIncrRevBody(cfg, v)` — renders the full incremental revenue HTML block. Element IDs for live recalc:
- `incr_fw_val` — F1 wager factor value (updated by `recalcEcon`)
- `incr_ret_lift` — total lift %
- `incr_players` — incremental player count
- `incr_rev` — incremental 3-month revenue
- `incr_camp_cost3` — campaign cost (3 months)
- `incr_net` — net incremental result

Called from `render(c)` via `_buildIncrRevBody(c, _calcRetentionV2(c))`, rendered inside a new `<div>` section at the bottom of `econBody` with green tint background.

**`recalcEcon()` incremental update** — when override wager changes, only F1 changes; F2–F5 stay from last generate. `campCost3` uses `3 × (data.ratio || E.costRatio) × pl × arpu` (updated cost ratio from recalc response).

### `public/campaign-generator.html` — AI Campaign Generator SPA

Fully self-contained (no app.js). All logic inline.

Key JS objects:
- `GEO_LBL` — country code → display label; includes grouped `eu:'🇪🇺 EU / UK'` + individual EU countries
- `GEO_LANG` — country code → default language (`dk:'da'`, `uk:'en'`, `ru:'ru'`, `de:'de'`, `fr/it/nl/eu:'en'`, `es:'es'`, etc.)
- `S` — current session state

**EU grouped geo (Step 2)** — geo dropdown has a single `eu` option instead of separate DE/DK/UK entries. Selecting `eu` shows `#eu-ctry-wrap` — a chip group (DE / FR / ES / IT / NL / DK / UK). Clicking a chip calls `pickEuCountry(chip)` which resolves `draft.params.geo` to the actual country code and sets `draft.params._euPending = false`. Attempting to proceed to Step 3 without picking a country shows an alert and returns to Step 2. License chip resets to `auto` on country pick; `GEO_CFG[country].lic` resolves the correct license downstream.

Supported languages: `da` (Danish), `de` (German), `en` (English), `ru` (Russian), `es` (Spanish), `mn` (Mongolian).

Key i18n helpers:
- `setUILang(lang)` — swaps all `data-i18n` text; must only reference DOM elements that exist **above** the `<script>` tag in source order (elements after `</script>` are not yet parsed)
- `localizedAlts(data)` — returns `data.alternativesEn` or `data.alternativesRu` based on `currentLang`; use instead of `data.alternatives` to get localized alternative mechanic cards

**License chip selector (Step 2)** — 10 chips: `auto / mga / ukgc / dga / curacao / anjouan / kahnawake / gibraltar / isle_of_man / none`. Default is `auto` (resolves to `GEO_CFG[geo].lic`). Resets to `auto` when geo changes via `syncLangToGeo()`. Value flows through `draft.params.lic` → `POST /api/campaign/generate` → `campaign.service.ts` → `buildConfig` + both AI prompts.

**Step 2 — Risk hint** — `RISK_HINTS` object + `updateRiskHint(val)` function. Called on chip click and on `goStep(2)`. Shows a coloured hint below the risk toggle explaining wager impact:
- `low` (green) — wager +10× above regional base, better operator protection
- `mid` (blue) — wager unchanged, market standard
- `high` (amber) — wager −8×, higher conversion but higher payout risk

**Step 3 — Economics panel** — `renderEconScenarios(econ, _unused, _unused2, cur, lang, fullData)`:

Signature updated 2026-05-20 to accept a 6th `fullData` parameter (the full `/api/campaign/generate` response). Required by the v2 incremental model to access mechanic fields (`welcome`, `ndb`, `reload`, `dep2`, `fsSpec`, `cashback`) for the F3 mechanics factor.

Call site: `renderEconScenarios(E, data.pl ?? E.pl, data.dep, cur, currentLang, data)`

- Three scenario cards: Best case / Expected / Worst case (no P10/P50/P90 labels shown)
- Card cost formatted as `cur + ' ' + amount` (e.g. `EUR 1 234`)
- `pl` taken from `econ.pl`; base (`pl × avgdep`) derived as `econ.sP50.cost / econ.costRatio` to avoid needing `dep` (not returned by campaign API)
- `p50r` uses pre-computed `econ.costRatio` directly; `p10r` and `p90r` = `sP{n}.cost / base`
- Each card shows 3 metrics with CSS-only `data-tip` tooltips: **cost per bonus** (`sP.cost / (pl × conv)`), **deposit load** (`ratio`), **wager completion** (`conv × 100%`)
- `conv` values come from `econ.sP10.conv / sP50.conv / sP90.conv` (0.10 / 0.20 / 0.40)
- Range bar sits below the grid; `econCard` is full-width outside `res-grid`
- `econCard` rendering wrapped in `try/catch` — errors display inline as red text rather than silently leaving the card empty

**Incremental Revenue v2 — Campaign Generator** — appended inside `renderEconScenarios` return value as `${(()=>{ try { ... } catch(e) { return ''; } })()}`. Self-contained IIFE, no external function calls. Uses `fullData` for mechanics, `draft?.params?.segment` for segment, `draft?.params?.plat` for platform (defaults to `'both'` if unset). Outputs same factor breakdown table + outcome metrics as Configurator version.

When `netIncr < 0`, the IIFE stores lift + economics in `window._lastCGIncrData` and renders an AI recommendations button that calls `_cgRunOptimize(btn)` (global function defined in the same script block).

**`_cgRunOptimize(btn)`** — global function in `campaign-generator.html`. Reads `window._lastCGIncrData`, POSTs to `/api/campaign/optimize`, renders recommendation cards (factor badge, param change, reason, impact colour) into `#cg_incr_ai_result`.

**Campaign cost in incremental model (`campCost3`)** — `3 × costRatio × pl × arpu` in both Configurator and Campaign Generator. Uses dimensionless `costRatio` × USD-denominated `arpu` — currency-safe. Previous formula `3 × mBudget = 3 × pl × cac` was incorrect (made breakeven structurally unreachable, required lift > CAC/ARPU ≈ 42%).

**Tooltip CSS** — `.tip` class with `::after` pseudo-element. `position:absolute; bottom:calc(100% + 6px)`. Requires parent to have `overflow:visible` (all econ card parents do). `z-index:50`.

Flow: select geo → auto-set language → select scenario → `/api/campaign/generate` → optional `/api/campaign/texts` → optional `/api/campaign/audit` → save to localStorage.

### `public/index.html` — Landing page

EN/RU toggle. Signup form → `/api/signup`. Cookie consent banner (localStorage `cookieConsent`, 1.2s delay). Footer: `/privacy`, `/terms`.

**Sections (top → bottom):**
1. Hero — **two-column layout** (`.hero-layout { display:flex; gap:56px }`). Left: headline H1 `clamp(2.8rem,6.2vw,4.8rem)`, subtitle, CTA button with `ctaPulse` glow animation. Right: `.hero-visual` — glassmorphism card (`backdrop-filter:blur(20px)`, `rgba(22,28,45,.85)`) cycling 3 campaign mockup cards every 4s. Canvas floating particles (38 dots, 40% opacity). 3 drift orbs (`.hero-orb-1/2/3`) blurred 80px, 18–28s animation. Staggered fade-up reveal (7 elements, 110ms stagger). Responsive breakpoint 960px → single column.
2. Marquee — scrolling feature highlights
3. Features (6 cards) — AI Generator, 5-Channel Texts, AI Compliance Audit, Multi-Geo Engine, Unit Economics, Admin Export
4. Markets — 6 region cards (CIS, EU/UKGC, Crypto, USA Sweeps, Mongolia, LatAm)
5. **License Rules** — 6 license cards with key constraints per jurisdiction (see below)
6. How it Works — 5 steps
7. Unit Economics preview — mock econ panel
8. Who It's For — 4 audience cards (Bonus Managers, CRM Leads, Consultants, Compliance Officers)
9. Demo Banner — CTA to AI Generator
10. Signup form — early access

**License Rules section** (`id="licenses"`) — added 2026-05-18. Six cards, each showing the license name, jurisdiction, strictness badge, and 4 key rules:

| Card | Strictness | Key rules |
|---|---|---|
| MGA | Standard | 20–40× wager, responsible gambling tools, clear T&Cs |
| UKGC | Strict | £10/spin cap, Gamstop check, BeGambleAware, no countdown timers |
| DGA | Strict | 1,000 DKK hard cap, 60-day min validity, ROFUS check, T&C font parity |
| Curaçao | Permissive | No statutory cap, basic KYC/AML, T&Cs on site, no self-exclusion registry |
| Anjouan | Permissive | No statutory cap, basic KYC, responsible gambling disclaimer recommended |
| Kahnawake | Standard | No bonus cap, player dispute resolution required, KYC/AML |
| Gibraltar | Standard | Fair wager terms, responsible gambling tools, GRA oversight |
| Isle of Man | Standard | Fair transparent T&Cs, responsible gambling, no statutory cap |
| Offshore/None | Flexible | No restrictions, operator self-regulates, base geo config applied |

i18n keys follow pattern: `mga_r1..4`, `ukgc_r1..4`, `dga_r1..4`, `cur_r1..4`, `anj_r1..4`, `kah_r1..4`, `gib_r1..4`, `iom_r1..4`, `none_r1..4`. Level badges: `lic_lv_high`, `lic_lv_mid`, `lic_lv_perm`, `lic_lv_flex`. Both EN and RU translations present.

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

  → POST /api/campaign/optimize { geo, segment, lift, economics, uiLang? }
  → buildOptimizePrompt(data) [mode:'optimize' or 'review']
  → aiGenerate(prompt, { maxTokens: 600 }) → parseOptimizeResponse()
  ← { recommendations[2-4]{factor, param, current, target, reason, impact} }
```

### Tournament Generator

```
tournament-generator.html
  → POST /api/tournament/generate { type, params: {geo, segment, entry, scoring, duration,
      prizePool, poolModel, rake, distribution, reentry, lang, tone} }
  → tournament.service.generateTournament()
  → GEO_CFG[geo] → { region, lic, sitecur }
  → calcTournamentEconomics({ region, segment, duration, prizePool, poolModel, rake })
  ← { spec, econ, params, cur, region, lic }
     econ: { arpu, eligible, durationDays, participantsLow/Mid/High,
             ggrLiftLow/Mid/High, prizePoolCost, netMarginLow/Mid/High,
             costPerActiveLow/Mid/High, roi, breakEvenParticipants }

  → POST /api/tournament/texts { type, spec, params, econ }
  → buildTournamentTextsPrompt()
  → aiGenerate(prompt, { maxTokens: 4096 }) → parseTournamentTextsResponse()
  ← { push[3], email[3], sms[3], telegram[3], popup[3] }

  → POST /api/tournament/audit { type, spec, params, econ }
  → buildTournamentAuditPrompt() [+ license-specific rules]
  → aiGenerate(prompt, { maxTokens: 900 }) → parseTournamentAuditResponse()
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

## Incremental Revenue v2 — model reference

### Formula

```
lift = min(0.40, base × F1 × F2 × F3 × F4 × F5)
```

| Factor | Variable | Formula | Notes |
|--------|----------|---------|-------|
| Base | `base` | `SEG_LIFT[seg]` | new=0.25, mid=0.18, vip=0.12 |
| F1 Wager | `wagFactor` | `clamp(0.7 + 0.3 × clamp(beW/wagerX, 0.3, 2.0), 0.65, 1.35)` | Continuous. Score>1 when beW>wagerX (player-friendly) |
| F2 Generosity | `genFactor` | `clamp(0.85 + 0.30 × min(matchPct/100, 1.0), 0.85, 1.15)` | Neutral at ~50% match |
| F3 Mechanics | `mechFactor` | `1 + hasNDB×0.06 + hasRL×0.08 + hasDep2×0.04 + hasFS×0.04 + hasCB×0.07` | Max ≈ 1.29 (all active) |
| F4 RTP | `rtpFactor` | `clamp(0.94 + 0.12 × ((rtp − 0.85) / 0.14), 0.94, 1.06)` | Range 85%–99% RTP |
| F5 Platform | `platFactor` | `{ mobile:1.05, desk:0.97, both:1.0 }` | — |

Mechanics flags: `hasNDB = N.amt>0 or N.fs>0`, `hasRL = RL.pct>0`, `hasDep2 = D2.pct>0`, `hasFS = FS && FS.count>20`, `hasCB = CB.pct>=5 or CB.model==='tier'`.

### Incremental economics

```
incrPl    = round(pl × lift)
incrRev   = incrPl × ltv3                          // USD
campCost3 = 3 × costRatio × pl × arpu              // USD — actual bonus payout cost
net       = incrRev − campCost3
```

### Live recalc (Configurator only)

`recalcEcon()` updates only the **F1-sensitive** elements after wager override:
- Reads `overrideWager = gv('ov_w_wager', E.wagerX)`
- Calls `_calcRetentionV2(cfg, overrideWager)` — full 5-factor calc with new wager
- Updates DOM elements: `incr_fw_val`, `incr_ret_lift`, `incr_players`, `incr_rev`, `incr_camp_cost3`, `incr_net`
- F2–F5 are static per-generate (only change when user clicks Generate again)

---

## POST /api/campaign/optimize — AI optimization endpoint

Returns 2–4 parameter-change recommendations when incremental net result is negative.

**Route**: `POST /api/campaign/optimize` — `aiLimiter`, `validate(OptimizeSchema)`

**Files** (all implemented):
- `src/validation/optimize.schema.ts` — `OptimizeSchema` (geo, segment, lift object, economics object)
- `src/ai/prompts/optimize.prompt.ts` — `buildOptimizePrompt(data: OptimizeInput)` — RU/EN prompt with 5-factor table + economics
- `src/controllers/campaign.controller.ts` — `optimize()` handler — calls prompt → aiGenerate (600 tokens) → `parseOptimizeResponse()`
- `src/ai/parser.ts` — `OptimizeResponseSchema`, `parseOptimizeResponse()`, `OptimizeResponse` type

**Request shape**:
```typescript
{
  geo:       string,
  segment:   'new' | 'mid' | 'vip',
  lift: {
    wagFactor, wagerX, beW,
    genFactor, matchPct,
    mechFactor, hasNDB, hasReload, hasDep2, hasFS, hasCB,
    rtpFactor, rtp,
    platFactor, plat,
    base, lift
  },
  economics: { net, campCost3, incrRev, incrPl, pl },
  uiLang?:   string
}
```

**Response shape**: `{ recommendations: [{ factor, param, current, target, reason, impact: 'high'|'med'|'low' }] }`

**UI — Configurator (`app.js`)** ✅ **implemented**:
- `_runOptimize(btn)` — reads `_calcRetentionV2(_lastCfg)`, recomputes economics, POSTs to `/api/campaign/optimize`, renders recommendation cards into `#incr_ai_result`
- Button `🤖 Рекомендации AI` rendered in `_buildIncrRevBody` inside `#incr_ai_btn_wrap` only when `netIncr < 0`
- i18n keys: `btn_ai_optimize`, `ai_opt_loading`, `ai_opt_title`, `ai_opt_impact_high`, `ai_opt_impact_med`, `ai_opt_impact_low`, `ai_opt_err` (all 4 languages)
- Card style: indigo button → on click shows loading state → renders cards with factor badge, `current → target`, reason text, impact colour (`high`=#10b981, `med`=#f59e0b, `low`=#8892a4)

**UI — Campaign Generator (`campaign-generator.html`)** ⏳ **pending**:

Location: inside the Incremental Revenue IIFE at the end of `renderEconScenarios`, after the net result row, when `netIncr < 0`.

Step 1 — save state at render time:
```js
if (netIncr < 0) {
  window._lastCGIncrData = {
    geo:       draft?.params?.geo,
    segment:   seg,
    lift: {
      wagFactor: wagF, wagerX, beW,
      genFactor: genF, matchPct,
      mechFactor: mechF, hasNDB, hasReload: hasRL, hasDep2: hasD2, hasFS, hasCB,
      rtpFactor: rtpF, rtp,
      platFactor: platF, plat: platKey,
      base, lift,
    },
    economics: { net: netIncr, campCost3, incrRev, incrPl, pl },
    uiLang: currentLang,
  };
}
```

Step 2 — render button + result container (append to IIFE return string when `netIncr < 0`):
```html
<div id="cg_incr_ai_btn_wrap" style="margin-top:10px">
  <button onclick="_cgRunOptimize(this)"
    style="width:100%;padding:7px 12px;background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.45);
           border-radius:8px;color:#a5b4fc;font-size:12px;cursor:pointer;font-weight:600">
    🤖 ${isRu ? 'Рекомендации AI' : 'AI Recommendations'}
  </button>
</div>
<div id="cg_incr_ai_result"></div>
```

Step 3 — global function `_cgRunOptimize(btn)` (defined in the `<script>` block after `renderEconScenarios`):
```js
async function _cgRunOptimize(btn) {
  const d = window._lastCGIncrData;
  if (!d) return;
  const resultEl = document.getElementById('cg_incr_ai_result');
  const isRu = d.uiLang === 'ru';
  btn.disabled = true;
  btn.textContent = isRu ? 'AI анализирует параметры…' : 'AI is analysing parameters…';
  resultEl.innerHTML = '';
  try {
    const resp = await fetch('/api/campaign/optimize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    const impactClr = { high:'#10b981', med:'#f59e0b', low:'#8892a4' };
    const impactLbl = isRu
      ? { high:'Высокий', med:'Средний', low:'Низкий' }
      : { high:'High',    med:'Medium',  low:'Low'    };
    const cards = (data.recommendations || []).map(rec => `
      <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);
                  border-radius:8px;padding:8px 10px;margin-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:#a5b4fc">${rec.factor} · ${rec.param}</span>
          <span style="font-size:10px;font-weight:600;color:${impactClr[rec.impact]||'#8892a4'}">${impactLbl[rec.impact]||rec.impact}</span>
        </div>
        <div style="font-size:11px;color:#8892a4;margin-bottom:3px">${rec.current} → <strong style="color:#f1f5f9">${rec.target}</strong></div>
        <div style="font-size:11px;color:#f1f5f9">${rec.reason}</div>
      </div>`).join('');
    resultEl.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:#a5b4fc;margin-top:10px;margin-bottom:2px">
        ${isRu ? 'Рекомендации по оптимизации' : 'Optimisation Recommendations'}
      </div>${cards}`;
    btn.textContent = isRu ? '🤖 Рекомендации AI' : '🤖 AI Recommendations';
    btn.disabled = false;
  } catch (e) {
    resultEl.innerHTML = `<div style="color:#EF4444;font-size:11px;margin-top:6px">
      ${isRu ? 'Не удалось получить рекомендации. Попробуйте ещё раз.' : 'Could not get recommendations. Please try again.'}
    </div>`;
    btn.textContent = isRu ? '🤖 Рекомендации AI' : '🤖 AI Recommendations';
    btn.disabled = false;
  }
}
```

---

## Known tech debt / pending work

---

### Pending features — Incremental Revenue AI analysis

#### Task A — Projected result per recommendation (frontend recalc)

After AI returns recommendations, the frontend applies each param-change to the 5-factor formula and shows the projected outcome.

**How it works:**
Each recommendation has a `param` field (`wager`, `matchPct`, `addNDB`, `addReload`, `addCashback`, `addDep2`, `addFS`, `rtp`, `plat`). The frontend maps each to its factor formula and computes a new lift:

```javascript
function _applyRecsToLift(v, recs) {
  // v = current lift factors from _calcRetentionV2 or _lastCGIncrData.lift
  let { wagFactor, genFactor, mechFactor, rtpFactor, platFactor } = v;
  for (const rec of recs) {
    const tgt = rec.target; // e.g. "15×", "75%", "mobile"
    if (rec.param === 'wager') {
      const newW = parseFloat(tgt);
      if (!isNaN(newW) && newW > 0)
        wagFactor = Math.min(1.35, Math.max(0.65, 0.7 + 0.3 * Math.min(2.0, Math.max(0.3, v.beW / newW))));
    } else if (rec.param === 'matchPct') {
      const newM = parseFloat(tgt);
      if (!isNaN(newM))
        genFactor = Math.min(1.15, Math.max(0.85, 0.85 + 0.30 * Math.min(1.0, newM / 100)));
    } else if (rec.param === 'addNDB')      mechFactor = Math.min(mechFactor + 0.06, 1.29);
      else if (rec.param === 'addReload')   mechFactor = Math.min(mechFactor + 0.08, 1.29);
      else if (rec.param === 'addCashback') mechFactor = Math.min(mechFactor + 0.07, 1.29);
      else if (rec.param === 'addDep2')     mechFactor = Math.min(mechFactor + 0.04, 1.29);
      else if (rec.param === 'addFS')       mechFactor = Math.min(mechFactor + 0.04, 1.29);
    else if (rec.param === 'rtp') {
      const newRtp = parseFloat(tgt) / 100;
      if (!isNaN(newRtp))
        rtpFactor = Math.min(1.06, Math.max(0.94, 0.94 + 0.12 * ((newRtp - 0.85) / 0.14)));
    } else if (rec.param === 'plat') {
      platFactor = { mobile: 1.05, desk: 0.97, both: 1.0 }[tgt] ?? platFactor;
    }
  }
  return Math.min(0.40, v.base * wagFactor * genFactor * mechFactor * rtpFactor * platFactor);
}
```

**Where to add:**
- `app.js` `_runOptimize`: after rendering cards, call `_applyRecsToLift(v, data.recommendations)` and append a summary block showing `lift: X% → Y%` and `net: $A → $B`.
- `campaign-generator.html` `_cgRunOptimize`: same, using `window._lastCGIncrData.lift` and recomputing `incrRev` and `net` with new lift.

**Summary block HTML** (append after cards in result container):
```html
<div style="margin-top:10px;padding:8px 10px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.3);border-radius:8px">
  <div style="font-size:11px;color:#a5b4fc;font-weight:700;margin-bottom:4px">
    ${isRu ? 'Прогноз после изменений' : 'Projected after changes'}
  </div>
  <div style="display:flex;gap:16px;font-size:11px">
    <span>Lift: <strong>${(curLift*100).toFixed(1)}% → ${(newLift*100).toFixed(1)}%</strong></span>
    <span style="color:${newNet>0?'#10b981':'#f59e0b'}">
      Net: ${isRu?'':''}${newNet>=0?'+':'−'}$${Math.abs(newNet).toLocaleString()} ~USD
    </span>
  </div>
</div>
```

---

#### Task B — AI campaign review when net result is positive

Show a `📊 Анализ кампании` button when `netIncr > 0` (same location as the optimize button for negative results).

**Two sub-cases:**
- `netIncr > 0` but margin thin (< 15% of campCost3): show amber button, prompt focuses on risk + strengthening
- `netIncr > 0` and margin solid (≥ 15%): show green button, prompt focuses on growth opportunities

**New prompt mode in `optimize.prompt.ts`** — add `mode: 'review'` to `OptimizeInput`:

```typescript
// In OptimizeInput interface:
mode?: 'optimize' | 'review';
```

In `buildOptimizePrompt`, when `mode === 'review'`:
- Change task description from "make net positive" to "identify what's working and how to push further"
- Ask for 2–3 `opportunities` instead of `recommendations` (same response shape, different framing)
- Include a `summary` field: 1–2 sentence explanation of why the campaign works

**Response schema addition** — `OptimizeResponseSchema` already works; just the `summary` field needs adding:
```typescript
const OptimizeResponseSchema = z.object({
  summary:         z.string().optional(),        // ← new: 1-2 sentence campaign verdict
  recommendations: z.array(OptimizeRecommendationSchema).min(1).max(4),
});
```

**UI** (both Configurator and Campaign Generator):
- Positive result → show `📊 Анализ кампании` / `📊 Campaign Analysis` button below net row
- If `netIncr / campCost3 < 0.15`: amber style (`rgba(245,158,11,.18)`, border amber)
- If `netIncr / campCost3 >= 0.15`: green style (`rgba(16,185,129,.18)`, border green)
- On click: same `_runOptimize` / `_cgRunOptimize` flow with `mode: 'review'` appended to POST body
- Result: show `summary` text first (grey italic), then opportunity cards

**i18n keys needed** (all 4 languages):
- `btn_ai_review` — "📊 Анализ кампании" / "📊 Campaign Analysis"
- `ai_rev_title` — "Возможности для роста" / "Growth Opportunities"
- `ai_rev_summary_title` — "Оценка кампании" / "Campaign Assessment"

---

### Tournament Generator — `public/tournament-generator.html`

Self-contained 4-step SPA at `/tournament-generator.html`. No `app.js` dependency.

**Steps:**
1. Tournament type — slot / live / mixed / prize_drop
2. Parameters — geo (same as Campaign Generator, EU grouped), segment, entry model (free/paid), scoring, duration (flash/daily/weekly/monthly/multi_round), prize pool, pool model (fixed/dynamic/hybrid), distribution schema, reentry, lang, tone
3. Economics + prize distribution table
4. AI texts (5 channels) + compliance audit

**Backend files:**
- `src/domain/tournament/calcEconomics.ts` — pure economics function
  - `ARPU_BY_REGION: { eu:65, cis:22, mn:12, sweep:30, crypto:80, latam:18 }`
  - `ELIGIBLE_BY_SEGMENT: { all:5000, new:1000, vip:500, dormant:2000, depositors:3000 }`
  - `DURATION_DAYS: { flash:0.03, daily:1, weekly:7, monthly:30, multi_round:10 }`
  - Participation rates: Low=5%, Mid=10%, High=15%
  - prizePoolCost: fixed=prizePool, dynamic=prizePool×(1−rake/100), hybrid=prizePool×0.6
  - Returns: `{ arpu, eligible, durationDays, participantsLow/Mid/High, ggrLiftLow/Mid/High, prizePoolCost, netMarginLow/Mid/High, costPerActiveLow/Mid/High, roi, breakEvenParticipants }`
- `src/services/tournament.service.ts` — `generateTournament({type, params})` → `{ spec, econ, params, cur, region, lic }`
  - Prize distribution schemas: `top_n`, `linear_decay`, `flat_tier`, `prize_drop`
- `src/controllers/tournament.controller.ts` — `generate`, `texts`, `audit` handlers
- `src/routes/tournament.routes.ts` — mounted at `/api/tournament`
- `src/ai/prompts/tournament-texts.prompt.ts` — 5-channel CRM copy for tournaments
- `src/ai/prompts/tournament-audit.prompt.ts` — compliance audit (DGA, UKGC, MGA rules)
- `src/ai/parser.ts` — `parseTournamentTextsResponse()`, `parseTournamentAuditResponse()`

**Tests:** `tests/domain/calcEconomics.test.js` — 20 tests: defaults, poolModel variants, segments, durations, regions.

---

### Campaign Generator — completed features (2026-05-21)

**Task C (✅ done) — Reload excluded from first-launch scenarios**

`src/services/campaign.service.ts` strips `reload` from `effectiveTypes` when `scenarioId` is `first_dep` or `first_launch`. `allMechanics` still contains reload (for alternatives display). The F3 mechanics factor in the frontend IIFE reads `hasRL` from `selectedMechanics.reload` (not `allMechanics.reload`).

**Task D (✅ done) — AI recommendations + Quick Apply & Recalculate**

- `_cgRunOptimize(btn)` — stores `_recs` on `window._lastCGIncrData`, renders recommendation cards, then an Apply button
- `_cgApplyRecs(recs)` — maps `rec.param` → `draft.params` updates, shows loading in `mechCard`, calls `renderMechanicResults(data)` for full Step 3 re-render on success
- `BTYPE_PRESETS['first_launch']` — removed `reload` from preset chips

**Confirmation modal for "New Campaign" button (✅ done)**

`#new-camp-modal` — shown when clicking the "+ New Campaign" topbar button while wizard is active (step > 1 or scenario selected). Functions: `confirmNewCampaign()`, `closeNewCampModal()`. i18n: `nc_title`, `nc_body`, `nc_stay`, `nc_confirm` (RU + EN).

**Segment presets per scenario (✅ done)**

`SEGMENT_PRESETS` map in `campaign-generator.html`:
- `first_launch`, `first_dep` → segment `'new'`
- `vip_retention`, `vip_reactivation` → segment `'vip'`
- All others → default `'mid'`

Applied inside `preselectBtypes(scenarioId)` — updates both DOM chips and `draft.params.segment`.

---

**P0/P1:**
- Add `dk` country to `buildConfig.test.js` snapshot
- Add RU/KZ/MN snapshots to `buildConfig.test.js` to cover payout fallback path

**P2:**
- Move inline `<script>` blocks from HTML files to external `.js` files → remove CSP `'unsafe-inline'`
- Task A: after AI returns recommendations, apply each param-change to 5-factor formula and show projected lift + net delta in the UI (both Configurator and Campaign Generator)
- Task B: AI campaign review when `netIncr > 0` — "📊 Campaign Analysis" button with `mode:'review'` in optimize prompt

**P3:**
- Test DK scenario in campaign.service integration test
- `truncNormalPayout` is not scale-invariant. Long-term: replace or add EUR-equivalent cap before calling. Current deterministic fallback is pragmatic.
- **Stale econ data UX**: in the Configurator, `econ.pl` in the incremental block reflects the last Generate call, NOT the current slider value. Changing players without re-generating shows outdated incrPl. Fix: show a visual "stale — click Generate" indicator when any generate-relevant param changes after the last generate.
