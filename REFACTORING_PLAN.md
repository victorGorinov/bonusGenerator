# Backend Refactoring Plan
> Bonus Engine — 12-phase plan adapted to the actual codebase

---

## Current state snapshot

`server.js` — 736 lines, single file, contains:

| Block | Lines | Description |
|---|---|---|
| Express bootstrap + rate limiters | 1–20 | App init, static files, rate limit setup |
| Math utilities | 22–43 | `_erf`, `_phi`, `_Phi`, `truncNormalPayout` |
| `buildConfig(params)` | 44–330 | Core business logic — 6 regions, all bonus types |
| `recalcCosts(cfg, overrides)` | 331–394 | Override-based economic recalculation |
| Route handlers | 395–447 | `/api/recalc`, `/api/generate`, `/api/signup` |
| Campaign logic | 448–532 | `GEO_CFG`, `SCENARIO_MSG`, `campaignExplanation`, `campaignAlternatives` |
| `/api/campaign/generate` | 533–586 | Campaign generation endpoint |
| AI utilities | 587–630 | `TONE_DESC`, `LANG_NAME`, `bonusLine`, `tryRepairJSON`, `parseAI` |
| `/api/campaign/texts` | 631–683 | Text generation via Claude API |
| `/api/campaign/audit` | 684–730 | Compliance audit via Claude API |
| Server startup | 731–736 | `app.listen` |

Primary risks: all Anthropic client instances created per-request; `tryRepairJSON` + regex is fragile; zero tests on `buildConfig`; no input validation at API boundary.

---

## Phase priority matrix

| Phase | Value | Risk | Effort | Priority |
|---|---|---|---|---|
| 1 — Architecture split | High | Low | Medium | **P0 — Start here** |
| 4 — Domain extraction | High | Low | Medium | **P0 — With phase 1** |
| 9 — Error handling | High | Low | Low | **P1** |
| 3 — Validation (Zod) | High | Medium | Medium | **P1** |
| 6 — AI layer isolation | High | Medium | Medium | **P1** |
| 7 — Structured AI outputs | High | High | Medium | **P2** |
| 8 — Testing infrastructure | High | Low | High | **P2** |
| 10 — Security hardening | Medium | Low | Low | **P2** |
| 5 — Config-driven architecture | Medium | Medium | High | **P3** |
| 2 — TypeScript migration | Medium | Medium | High | **P3** |
| 11 — Observability | Medium | Low | Low | **P3** |
| 12 — Performance | Low | Low | Low | **P4** |

---

## Phase 1 — Architecture Split

**Goal:** Break `server.js` into isolated modules without changing behavior.

### Target structure

```
src/
  server/
    app.js          ← Express init, middleware, static files
    bootstrap.js    ← app.listen, env check

  routes/
    generate.routes.js    ← POST /api/generate, POST /api/recalc
    campaign.routes.js    ← POST /api/campaign/generate, /texts, /audit
    signup.routes.js      ← POST /api/signup
    health.routes.js      ← GET /api/health

  controllers/
    generate.controller.js
    campaign.controller.js
    signup.controller.js

  services/
    bonus.service.js      ← calls buildConfig + recalcCosts
    campaign.service.js   ← orchestrates campaign generation flow
    ai.service.js         ← calls Anthropic, retries, parses response
    email.service.js      ← wraps Resend

  domain/
    bonus/
      buildConfig.js      ← extracted verbatim from server.js (lines 44–330)
      recalcCosts.js      ← extracted from server.js (lines 331–394)
      payout.js           ← _erf, _phi, _Phi, truncNormalPayout (lines 22–43)
    campaign/
      scenarios.js        ← GEO_CFG, SCENARIO_MSG (lines 451–484)
      explanation.js      ← campaignExplanation, campaignAlternatives (lines 485–532)
    ai/
      prompts.js          ← inline prompt strings extracted
      parser.js           ← tryRepairJSON, parseAI, bonusLine (lines 593–630)

  middleware/
    rateLimiter.js        ← apiLimiter, signupLimiter, campaignLimiter, aiLimiter
    errors.js             ← (Phase 9)
    validate.js           ← (Phase 3)

  config/
    index.js              ← env vars, constants

server.js               ← becomes 10-line entry point only
```

### Migration steps

1. Create `src/` folder structure
2. Move `_erf / _phi / _Phi / truncNormalPayout` → `domain/bonus/payout.js` (pure, no deps)
3. Move `buildConfig` → `domain/bonus/buildConfig.js` (import payout.js)
4. Move `recalcCosts` → `domain/bonus/recalcCosts.js` (import payout.js)
5. Move `GEO_CFG`, `SCENARIO_MSG` → `domain/campaign/scenarios.js`
6. Move `campaignExplanation`, `campaignAlternatives` → `domain/campaign/explanation.js`
7. Move `tryRepairJSON`, `parseAI`, `bonusLine` → `domain/ai/parser.js`
8. Create `services/ai.service.js` — singleton Anthropic client (not per-request), wraps generate calls
9. Create `services/bonus.service.js` — calls buildConfig + recalcCosts
10. Create `services/campaign.service.js` — orchestrates campaign flow
11. Extract route handlers into controllers
12. Wire routes → controllers → services
13. Reduce `server.js` to: `import app from './src/server/app.js'; app.listen(...)`

### Acceptance criteria

- `server.js` is ≤15 lines (bootstrap only)
- `buildConfig` tests can be written importing `domain/bonus/buildConfig.js` directly
- Anthropic client created once, reused across requests

---

## Phase 4 — Domain Layer Extraction (run with Phase 1)

**Goal:** Make `buildConfig` and `recalcCosts` pure and independently testable.

### What to do

`buildConfig` and `recalcCosts` are already nearly pure (no req/res, no side effects). The migration is mechanical:

```js
// domain/bonus/buildConfig.js
import { truncNormalPayout } from './payout.js';
export function buildConfig(params) { /* ... */ }
```

Additionally, identify hardcoded branching for Phase 5 prep:
```js
// These become config-driven in Phase 5:
if (r === 'eu' && license === 'ukgc') { ... }
if (r === 'cis') { ... }
if (r === 'crypto') { ... }
```

Mark with `// TODO(phase-5): config-driven` comments during Phase 1.

---

## Phase 9 — Error Handling (P1)

**Goal:** Replace scattered try/catch with a centralized error system.

### Current problems in server.js

```js
// /api/campaign/texts — line 631
} catch(e) { res.status(500).json({error: e.message}); }
// inconsistent: some routes expose e.message, some don't
```

### Target

```
src/errors/
  AppError.js
  ValidationError.js
  AIProviderError.js
```

```js
// middleware/errors.js
export function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const body = {
    code:      err.code || 'INTERNAL_ERROR',
    message:   err.isOperational ? err.message : 'Internal server error',
    requestId: req.id,
  };
  // Never expose stack in production
  if (process.env.NODE_ENV !== 'production') body.stack = err.stack;
  res.status(status).json(body);
}
```

All route handlers become:
```js
// controller
async function generateCampaign(req, res, next) {
  try {
    const result = await campaignService.generate(req.body);
    res.json(result);
  } catch (err) {
    next(err); // centralized handling
  }
}
```

---

## Phase 3 — Validation Layer (P1)

**Goal:** Validate all API inputs with Zod before they reach business logic.

### Schemas needed

```
src/validation/
  generate.schema.js      ← POST /api/generate body
  recalc.schema.js        ← POST /api/recalc body
  campaign.schema.js      ← POST /api/campaign/generate body
  texts.schema.js         ← POST /api/campaign/texts body
  audit.schema.js         ← POST /api/campaign/audit body
  signup.schema.js        ← POST /api/signup body
```

### Key schemas (current unsafe access points)

```js
// generate.schema.js
import { z } from 'zod';
export const GenerateSchema = z.object({
  region:  z.enum(['cis','eu','crypto','sweep','mn','latam']),
  players: z.number().int().min(100).max(200_000),
  sitecur: z.string().min(2).max(5),
  depcur:  z.string().min(2).max(5),
  avgdep:  z.number().min(1).max(100_000),
  plat:    z.enum(['both','mobile','desk']),
  lic:     z.enum(['mga','ukgc','none']).optional(),
  rtp:     z.number().min(85).max(99),
  riskAdj: z.number().optional(),
});

// campaign.schema.js
export const CampaignGenerateSchema = z.object({
  scenarioId: z.string(),
  geo:        z.string().length(2),
  vertical:   z.enum(['casino','sports']),
  segment:    z.enum(['new','mid','vip']),
  budget:     z.number().positive(),
  tone:       z.enum(['friendly','pro','aggressive']),
  aggression: z.enum(['low','mid','high']),
  riskLevel:  z.enum(['low','mid','high']),
  lang:       z.string().min(2).max(2),
});
```

### Middleware

```js
// middleware/validate.js
export const validate = schema => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError(result.error.flatten()));
  }
  req.body = result.data; // typed, coerced
  next();
};
```

---

## Phase 6 — AI Layer Isolation (P1)

**Goal:** Extract Anthropic from route handlers into a reusable, testable layer.

### Current problem

```js
// server.js line 671 — Anthropic created per request
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// Also line 718 — duplicated
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

### Target

```
src/
  ai/
    client.js         ← singleton Anthropic instance
    prompts/
      texts.prompt.js   ← channel text generation prompt
      audit.prompt.js   ← compliance audit prompt
    providers/
      anthropic.js      ← implements AIProvider interface
    parser.js           ← tryRepairJSON, parseAI (moved from domain/ai)
```

```js
// ai/client.js
let _client = null;
export function getAIClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// ai/providers/anthropic.js
export async function generate(prompt, opts = {}) {
  const client = getAIClient();
  const maxRetries = opts.retries ?? 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const msg = await client.messages.create({
        model:      opts.model  ?? 'claude-haiku-4-5-20251001',
        max_tokens: opts.tokens ?? 1200,
        messages:   [{ role:'user', content: prompt }],
      });
      return msg.content[0].text;
    } catch(e) {
      if (attempt === maxRetries) throw new AIProviderError(e.message);
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}
```

```js
// ai/prompts/texts.prompt.js
export function buildTextsPrompt({ scenario, geo, segment, tone, lang, mechanic, langName }) {
  return `You are a CRM copywriter for an iGaming operator...
  /* full prompt extracted from route handler */`;
}

// ai/prompts/audit.prompt.js
export function buildAuditPrompt({ scenario, geo, mechanic, texts, lang }) {
  return `You are a gambling compliance officer...
  /* full prompt extracted from route handler */`;
}
```

---

## Phase 7 — Structured AI Outputs (P2)

**Goal:** Replace `tryRepairJSON` + regex with schema-validated parsing.

### Current fragile flow

```js
// server.js line 619
function parseAI(text) {
  // tries direct parse → repair → regex extraction
  // returns {} on failure — silent errors downstream
}
```

### Target pipeline

```
raw Claude response
  → sanitize (strip markdown fences, whitespace)
  → JSON.parse
  → validate with Zod schema
  → normalize (fill missing fields with safe defaults)
  → map to domain type
```

```js
// ai/parser.js
import { z } from 'zod';

const TextsResponseSchema = z.object({
  push:     z.array(z.string()).length(3),
  email:    z.array(z.string()).length(3),
  sms:      z.array(z.string()).length(3),
  telegram: z.array(z.string()).length(3),
  popup:    z.array(z.string()).length(3),
});

const AuditResponseSchema = z.object({
  checks: z.array(z.object({
    label:  z.string(),
    status: z.enum(['ok','warn']),
    note:   z.string(),
  })).min(1),
  recommendations: z.array(z.string()).min(1),
});

export function parseTextsResponse(raw) {
  const sanitized = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(sanitized);             // throws → caught in controller
  return TextsResponseSchema.parse(parsed);         // throws ZodError → ValidationError
}
```

---

## Phase 8 — Testing Infrastructure (P2)

**Goal:** Unit test the pure domain functions that currently have zero coverage.

### Install

```bash
npm install -D vitest
```

### Test targets (highest priority)

```
tests/
  domain/
    payout.test.js          ← truncNormalPayout edge cases
    buildConfig.test.js     ← snapshot per region × license combo
    recalcCosts.test.js     ← override combinations
  ai/
    parser.test.js          ← tryRepairJSON, parseAI inputs
  integration/
    api.generate.test.js    ← full POST /api/generate response shape
```

```js
// tests/domain/buildConfig.test.js
import { describe, it, expect } from 'vitest';
import { buildConfig } from '../../src/domain/bonus/buildConfig.js';

describe('buildConfig — EU/UKGC', () => {
  it('caps maxB at 200 for UKGC', () => {
    const cfg = buildConfig({ region:'eu', lic:'ukgc', avgdep:100, players:1000,
                              sitecur:'GBP', depcur:'GBP', plat:'both', rtp:96 });
    expect(cfg.welcome.maxB).toBeLessThanOrEqual(200);
  });

  it('returns costRatio > 0', () => {
    const cfg = buildConfig({ region:'eu', lic:'mga', avgdep:100, players:1000,
                              sitecur:'EUR', depcur:'EUR', plat:'both', rtp:96 });
    expect(cfg.econ.costRatio).toBeGreaterThan(0);
  });
});

describe('buildConfig — Sweep', () => {
  it('wager is 0 for sweepstakes', () => {
    const cfg = buildConfig({ region:'sweep', avgdep:20, players:1000,
                              sitecur:'SC', depcur:'SC', plat:'both', rtp:96 });
    expect(cfg.welcome.wager).toBe(0);
  });
});
```

### Snapshot tests

```js
// Snapshot the full config output for each region to detect regressions
it('CIS config snapshot', () => {
  const cfg = buildConfig({ region:'cis', avgdep:100, players:5000,
                            sitecur:'USD', depcur:'USD', plat:'both', rtp:96 });
  expect(cfg).toMatchSnapshot();
});
```

---

## Phase 10 — Security Hardening (P2)

**Goal:** Minimal effort, high impact.

### Install

```bash
npm install helmet
```

### Changes

```js
// src/server/app.js
import helmet from 'helmet';
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] }
}));
```

**Prompt injection guard** — add to `validate.js`:
```js
const MAX_STRING = 500;
// All string inputs: z.string().max(MAX_STRING) in Zod schemas (Phase 3)
// Prevents oversized payloads reaching AI prompts
```

**Production error safety** — already handled in Phase 9 error middleware.

---

## Phase 5 — Config-Driven Architecture (P3)

**Goal:** Replace `if (region === 'eu') { ... }` branching with declarative configs.

### Current hardcoded branching to eliminate

Identified in `buildConfig`:
- Region multipliers: `const multi = r === 'cis' ? 5 : r === 'eu' ? 6 : 4`
- UKGC caps: `r === 'eu' && license === 'ukgc' ? Math.max(100, Math.min(200, ...))`
- Min deposit rules per region
- Cashback rates per region
- NDB types per region

### Target

```js
// config/geo/eu.js
export const EU = {
  defaultLic: 'mga',
  welcome: {
    pctMin: 50, pctMax: 200,
    maxBMulti: 6,
    maxBCap: { mga: 5000, ukgc: 200 },
    minDMulti: 0.15,
    minDMin: 10,
    fs: 100,
    days: 30,
  },
  cashback: { pct: 10, cap: 500, wager: 1 },
  ndb: { type: 'fs_restricted', fs: 20, wager: 50 },
};

// config/geo/index.js
export const GEO = { eu: EU, cis: CIS, crypto: CRYPTO, sweep: SWEEP, mn: MN, latam: LATAM };
```

```js
// domain/bonus/buildConfig.js (Phase 5 version)
import { GEO } from '../../config/geo/index.js';
export function buildConfig(params) {
  const geo = GEO[params.region];
  const lic = params.lic || geo.defaultLic;
  const maxB = Math.min(
    geo.welcome.maxBCap[lic] ?? Infinity,
    Math.round(params.avgdep * geo.welcome.maxBMulti)
  );
  // No more if/else chains
}
```

**New regions** added by creating a new config file — no core logic changes.

---

## Phase 2 — TypeScript Migration (P3)

**Goal:** Add static typing. Do **after** Phase 1 (architecture split) is stable.

### Key types to define

```ts
// types/bonus.types.ts
export interface BonusConfig {
  welcome:  WelcomeMechanic;
  dep2:     DepositBonus;
  dep3:     DepositBonus;
  ndb:      NoDepositBonus;
  reload:   ReloadBonus;
  wager:    WagerConfig;
  cashback: CashbackConfig;
  econ:     EconModel;
  cur:      string;
  pl:       number;
  dep:      number;
  r:        Region;
}

export interface EconModel {
  arpu:             number;
  costRatio:        number;
  wagerX:           number;
  breakeven_wager:  number;
  over_breakeven:   boolean;
  sP10:             ScenarioResult;
  sP50:             ScenarioResult;
  sP90:             ScenarioResult;
  roi3:             number;
  ltv3:             number;
}

export type Region = 'cis' | 'eu' | 'crypto' | 'sweep' | 'mn' | 'latam';
export type License = 'mga' | 'ukgc' | 'none';
```

```ts
// types/ai.types.ts
export interface TextsResponse {
  push:     [string, string, string];
  email:    [string, string, string];
  sms:      [string, string, string];
  telegram: [string, string, string];
  popup:    [string, string, string];
}

export interface AuditResponse {
  checks:          AuditCheck[];
  recommendations: string[];
}
```

### Migration order

1. Add `tsconfig.json` with `allowJs: true` first — compile JS without errors
2. Rename files one module at a time: `payout.js → payout.ts` (lowest deps first)
3. Add types to function signatures
4. Enable `strict: true` once all files are `.ts`

---

## Phase 11 — Observability (P3)

**Goal:** Replace `console.log` with structured logging.

```bash
npm install pino pino-http
```

```js
// src/utils/logger.js
import pino from 'pino';
export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Log AI calls with timing + token usage
logger.info({ event:'ai.request', model, tokens, latency_ms, requestId });
logger.error({ event:'ai.failure', error: e.message, requestId });
```

---

## Phase 12 — Performance (P4)

Items already addressed by earlier phases:

| Issue | Fixed in |
|---|---|
| Anthropic client per request | Phase 6 (singleton) |
| `buildConfig` called twice for same params | Phase 8 (cache in service) |
| Rate limiters in `server.js` | Phase 1 (moved to middleware) |

Remaining:
- Cache `GEO_CFG` resolution (already a constant — no action needed)
- Add in-memory LRU cache for `buildConfig` (keyed by params hash) if load testing shows bottleneck

---

## Implementation schedule

```
Week 1  Phase 1 + 4  Architecture split + domain extraction
Week 2  Phase 9      Error handling
Week 3  Phase 3 + 6  Validation + AI isolation
Week 4  Phase 7      Structured AI outputs
Week 5  Phase 8      Testing infrastructure
Week 6  Phase 10     Security hardening
Later   Phase 5      Config-driven (large refactor)
Later   Phase 2      TypeScript (after codebase is stable)
Later   Phase 11–12  Observability + performance
```

---

## Definition of done (each phase)

- [ ] No regressions on `POST /api/generate` for all 6 regions
- [ ] No regressions on `POST /api/campaign/generate`
- [ ] No regressions on `POST /api/campaign/texts`
- [ ] No regressions on `POST /api/campaign/audit`
- [ ] `server.js` entry point is ≤15 lines after Phase 1
- [ ] All Phase 8 tests pass in CI
