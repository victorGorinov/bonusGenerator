# REFACTORING_PLAN.md

Based on code review findings. Date: 2026-05-29.
Review verdict: **Strong MVP / Early Production Ready** (7–8/10). Good foundation, specific gaps to close before further growth.

---

## Priority matrix

| # | Finding | Impact | Effort | Phase |
|---|---------|--------|--------|-------|
| F1 | Typed DTOs everywhere | High | Low | 1 |
| F2 | Config/env validation | High | Low | 1 |
| F3 | asyncHandler wrapper | Medium | Low | 1 |
| F4 | Retry: exponential backoff + jitter | Medium | Low | 1 |
| F5 | Domain layer structure | High | Medium | 2 |
| F6 | AI provider interface + abstraction | Medium | Medium | 2 |
| F7 | Use-case layer | Medium | Medium | 2 |
| F8 | DI / factory injection | Medium | Medium | 2 |
| F9 | Observability: request ID + metrics | High | Medium | 2 |
| F10 | Frontend build (Vite) + CSP hardening | High | High | 3 |
| F11 | CI pipeline | Medium | Medium | 3 |
| F12 | Caching, queues, OpenAPI | Low | High | 4 |

---

## Phase 1 — Quick wins (критично, мало усилий)

### F1 — Typed DTOs via `z.infer`

**Problem:** Controllers use `Record<string, unknown>` and `req.body || {}` — TypeScript loses meaning.

**Files:** `src/controllers/*.ts`, `src/validation/*.schema.ts`

**Pattern — typed request in every controller:**

```typescript
// src/validation/generate.schema.ts — already exists, add export type:
export type GenerateInput = z.infer<typeof GenerateSchema>;

// src/controllers/generate.controller.ts — before:
export function generate(req: Request, res: Response, next: NextFunction) {
  const cfg = bonusService.generate(req.body || {});  // ❌ untyped

// after:
import type { GenerateInput } from '../validation/generate.schema.js';

export function generate(req: Request<{}, {}, GenerateInput>, res: Response, next: NextFunction) {
  const cfg = bonusService.generate(req.body);  // ✅ typed
```

**Add export types to all schemas:**

```typescript
// generate.schema.ts
export type GenerateInput   = z.infer<typeof GenerateSchema>;

// campaign.schema.ts
export type CampaignInput   = z.infer<typeof CampaignGenerateSchema>;
export type TextsInput      = z.infer<typeof TextsSchema>;
export type AuditInput      = z.infer<typeof AuditSchema>;
export type OptimizeInput   = z.infer<typeof OptimizeSchema>;

// tournament.schema.ts
export type TournamentInput = z.infer<typeof TournamentGenerateSchema>;

// recalc.schema.ts
export type RecalcInput     = z.infer<typeof RecalcSchema>;
```

**Also replace in service signatures:**

```typescript
// src/services/bonus.service.ts — before:
export function buildConfig(params: Record<string, unknown>) {

// after:
import type { GenerateInput } from '../validation/generate.schema.js';
export function buildConfig(params: GenerateInput) {
```

**Also replace in domain functions:**

```typescript
// src/domain/bonus/buildConfig.ts — add explicit param type:
export function buildConfig(params: GenerateInput): BonusConfig {
```

**Checklist:**
- [ ] Export `z.infer` types from all 7 schema files
- [ ] Type all controller `req.body` parameters
- [ ] Type all service function signatures
- [ ] Remove all `Record<string, unknown>` from function signatures
- [ ] Run `npm run typecheck` — zero errors

---

### F2 — Config/env validation (fail-fast)

**Problem:** `dotenv/config` loaded but no validation — app starts silently broken with missing keys.

**File:** `src/config/index.ts` — add env schema at top:

```typescript
import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(10, 'ANTHROPIC_API_KEY is required'),
  RESEND_API_KEY:    z.string().min(10, 'RESEND_API_KEY is required'),
  NOTIFY_EMAIL:      z.string().email().default('victor.gorinov@gmail.com'),
  PORT:              z.string().regex(/^\d+$/).optional().default('3000'),
  NODE_ENV:          z.enum(['development', 'production', 'staging']).default('development'),
});

// Fail-fast on startup:
const _env = EnvSchema.safeParse(process.env);
if (!_env.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const ENV = _env.data;
export const PORT              = parseInt(ENV.PORT);
export const ANTHROPIC_API_KEY = ENV.ANTHROPIC_API_KEY;
export const RESEND_API_KEY    = ENV.RESEND_API_KEY;
export const NOTIFY_EMAIL      = ENV.NOTIFY_EMAIL;
```

**Also:** move model name out of provider into config:

```typescript
// src/config/index.ts — add:
export const AI_MODEL   = 'claude-haiku-4-5-20251001' as const;
export const AI_TIMEOUT = 30_000;

// src/ai/providers/anthropic.ts — use:
import { AI_MODEL, AI_TIMEOUT } from '../../config/index.js';
model: AI_MODEL,
```

**Checklist:**
- [ ] `EnvSchema` added to `src/config/index.ts`
- [ ] `process.exit(1)` on invalid env at startup
- [ ] `AI_MODEL` constant in config (not hardcoded in provider)
- [ ] Test: start without `ANTHROPIC_API_KEY` → clean error message

---

### F3 — asyncHandler wrapper (eliminate try/catch boilerplate)

**Problem:** Every controller has identical `try { ... } catch (err) { next(err) }` wrapping.

**File:** `src/middleware/asyncHandler.ts` — new file:

```typescript
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn<P={}, ResBody={}, ReqBody={}> =
  (req: Request<P, ResBody, ReqBody>, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler<P={}, ResBody={}, ReqBody={}>(
  fn: AsyncFn<P, ResBody, ReqBody>
): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req as any, res, next)).catch(next);
}
```

**Usage in controllers — before:**

```typescript
export function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const cfg = bonusService.generate(req.body);
    res.json({ cfg });
  } catch (err) {
    next(err);
  }
}
```

**After:**

```typescript
import { asyncHandler } from '../middleware/asyncHandler.js';
import type { GenerateInput } from '../validation/generate.schema.js';

export const generate = asyncHandler<{}, {}, GenerateInput>(async (req, res) => {
  const cfg = bonusService.generate(req.body);
  res.json({ cfg });
});
```

Apply to all controllers: `generate.controller.ts`, `campaign.controller.ts`, `tournament.controller.ts`, `signup.controller.ts`.

**Checklist:**
- [ ] `src/middleware/asyncHandler.ts` created
- [ ] All 4 controller files refactored — no bare `try/catch`
- [ ] Tests still pass after refactor

---

### F4 — Retry: exponential backoff + jitter

**Problem:** Current retry is linear (`300 * (attempt + 1)`). Can spike requests to Anthropic under load.

**File:** `src/ai/providers/anthropic.ts`

**Replace delay logic:**

```typescript
// Before:
await new Promise(r => setTimeout(r, 300 * (attempt + 1)));

// After — exponential backoff with full jitter:
function retryDelay(attempt: number): number {
  const base    = 300;
  const cap     = 10_000;
  const exp     = Math.min(cap, base * Math.pow(2, attempt));
  const jitter  = Math.random() * exp;  // full jitter: [0, exp]
  return Math.round(jitter);
}
```

**Also — retry only retryable errors:**

```typescript
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);

function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIStatusError) {
    return RETRYABLE_STATUS.has(err.status);
  }
  // Network errors (ECONNRESET, ETIMEDOUT) are retryable:
  if (err instanceof Error && 'code' in err) {
    return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes((err as any).code);
  }
  return false;
}

// In generate():
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    // ... call
  } catch (err) {
    if (attempt === MAX_RETRIES - 1 || !isRetryable(err)) throw err;
    await new Promise(r => setTimeout(r, retryDelay(attempt)));
  }
}
```

**Checklist:**
- [ ] `retryDelay()` replaces linear delay
- [ ] `isRetryable()` gate added
- [ ] 429 errors trigger retry; 400 errors do not

---

## Phase 2 — Architectural improvements

### F5 — Domain layer structure

**Problem:** `src/domain/` exists but only has bonus calculations. Services contain business logic that should live in domain. As features grow (auth, workspaces, billing), services will become procedural and coupled to Express.

**Target structure:**

```
src/domain/
  bonus/
    buildConfig.ts          ← exists
    recalcCosts.ts          ← exists
    payout.ts               ← exists
    BonusConfig.ts          ← NEW: explicit type/interface
  campaign/
    scenarios.ts            ← exists
    explanation.ts          ← exists
    CampaignResult.ts       ← NEW: typed result interface
  tournament/
    calcEconomics.ts        ← exists
    TournamentSpec.ts       ← NEW: typed spec interface
  ai/
    parser.ts               ← exists
  shared/
    Currency.ts             ← NEW: currency/geo value objects
    Region.ts               ← NEW: region enum + type guards
    Segment.ts              ← NEW: segment type ('new'|'mid'|'vip')
```

**Step 1 — Extract shared value objects:**

```typescript
// src/domain/shared/Segment.ts
export const SEGMENTS = ['new', 'mid', 'vip'] as const;
export type Segment = typeof SEGMENTS[number];
export const isSegment = (s: unknown): s is Segment => SEGMENTS.includes(s as any);

// src/domain/shared/Region.ts
export const REGIONS = ['eu', 'cis', 'crypto', 'sweep', 'mn', 'latam'] as const;
export type Region = typeof REGIONS[number];

// src/domain/shared/Currency.ts
export type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'RUB' | 'KZT' | 'MNT' | 'DKK';
```

**Step 2 — Add explicit return types to domain functions:**

```typescript
// src/domain/bonus/BonusConfig.ts — new file:
export interface BonusConfig {
  welcome:   WelcomeSpec;
  ndb:       NDBSpec;
  reload:    ReloadSpec;
  // ... full typed interface matching buildConfig output
  econ:      EconSpec;
  reg:       string[];
  cur:       CurrencyCode;
}

// src/domain/bonus/buildConfig.ts — update signature:
export function buildConfig(params: GenerateInput): BonusConfig {
```

**Step 3 — Move campaign explanation logic fully into domain:**

`src/services/campaign.service.ts` currently calls `campaignExplanation()` and assembles the result. The assembly logic belongs in domain:

```typescript
// src/domain/campaign/generateCampaignResult.ts — new file:
export function generateCampaignResult(
  geo: string,
  scenario: ScenarioInput,
  params: CampaignParams,
): CampaignResult {
  // pure function: no HTTP, no AI calls
  // assembles mechanic, explanation, alternatives, econ
}
```

Service becomes a thin orchestrator: calls domain functions and AI.

**Checklist:**
- [ ] `src/domain/shared/` created with `Segment.ts`, `Region.ts`, `Currency.ts`
- [ ] `BonusConfig.ts` interface in `src/domain/bonus/`
- [ ] `CampaignResult.ts` interface in `src/domain/campaign/`
- [ ] All domain functions have explicit return types (no implicit `any`)
- [ ] `npm run typecheck` passes

---

### F6 — AI provider interface + abstraction

**Problem:** `anthropic.ts` provider handles retry, logging, transport — tightly coupled. Adding OpenAI/Gemini or fallback chain means duplicating this logic.

**Target:**

```
src/ai/
  interface.ts           ← NEW: AIProvider interface
  client.ts              ← exists: singleton Anthropic SDK
  parser.ts              ← exists
  providers/
    anthropic.ts         ← refactored: implements AIProvider
    mock.ts              ← NEW: for tests
  registry.ts            ← NEW: provider selection
  prompts/
    ...                  ← exists
```

**Step 1 — Define interface:**

```typescript
// src/ai/interface.ts
export interface AIProvider {
  generate(prompt: string, opts?: AIGenerateOpts): Promise<string>;
}

export interface AIGenerateOpts {
  maxTokens?: number;
  temperature?: number;
}
```

**Step 2 — Anthropic provider implements interface:**

```typescript
// src/ai/providers/anthropic.ts
import type { AIProvider, AIGenerateOpts } from '../interface.js';

export class AnthropicProvider implements AIProvider {
  async generate(prompt: string, opts: AIGenerateOpts = {}): Promise<string> {
    // ... existing logic with retryDelay, isRetryable
  }
}
```

**Step 3 — Registry (simple for now):**

```typescript
// src/ai/registry.ts
import { AnthropicProvider } from './providers/anthropic.js';
import type { AIProvider } from './interface.js';

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  _provider ??= new AnthropicProvider();
  return _provider;
}

// For tests:
export function setAIProvider(p: AIProvider): void {
  _provider = p;
}
```

**Step 4 — Mock provider for tests:**

```typescript
// src/ai/providers/mock.ts
import type { AIProvider } from '../interface.js';

export class MockAIProvider implements AIProvider {
  constructor(private responses: string[] = []) {}
  async generate(): Promise<string> {
    return this.responses.shift() ?? '{}';
  }
}
```

**Checklist:**
- [ ] `src/ai/interface.ts` created
- [ ] `AnthropicProvider` class implements `AIProvider`
- [ ] `src/ai/registry.ts` with `getAIProvider()` / `setAIProvider()`
- [ ] `MockAIProvider` for tests — replace Anthropic SDK mocks in existing tests
- [ ] `ai.service.ts` uses `getAIProvider().generate()` instead of direct import

---

### F7 — Use-case layer (light touch)

**Problem:** `controller → service` is fine now. When DB/auth/billing land, services will couple to transport concerns.

**Not a big refactor — add a thin use-case directory:**

```
src/use-cases/
  GenerateBonusConfig.ts
  GenerateCampaign.ts
  GenerateTournament.ts
```

Each use-case is a plain function or class taking typed input and returning typed output. Controllers call use-cases; use-cases call services/domain/AI. Services remain but become narrower.

**Example:**

```typescript
// src/use-cases/GenerateCampaign.ts
import type { CampaignInput } from '../validation/campaign.schema.js';
import type { CampaignResult } from '../domain/campaign/CampaignResult.js';
import * as campaignService from '../services/campaign.service.js';
import { generateTexts, generateAudit } from '../services/ai.service.js';

export async function generateCampaignUseCase(
  input: CampaignInput,
): Promise<CampaignResult> {
  return campaignService.generateCampaign(input);
}
```

Start thin. Expand when DB/auth arrives.

**Checklist:**
- [ ] `src/use-cases/` directory created
- [ ] `GenerateBonusConfig.ts`, `GenerateCampaign.ts`, `GenerateTournament.ts`
- [ ] Controllers call use-cases (not services directly)

---

### F8 — Factory injection for controllers

**Problem:** Controllers import services directly → hard to mock in unit tests without module-level mocking.

**Pattern — factory functions:**

```typescript
// src/controllers/generate.controller.ts — before:
import * as bonusService from '../services/bonus.service.js';

export const generate = asyncHandler(async (req, res) => {
  const cfg = bonusService.buildConfig(req.body);
  res.json(cfg);
});

// after:
export function createGenerateController(deps: { bonusService: typeof import('../services/bonus.service.js') }) {
  return {
    generate: asyncHandler<{}, {}, GenerateInput>(async (req, res) => {
      const cfg = deps.bonusService.buildConfig(req.body);
      res.json(cfg);
    }),
    recalc: asyncHandler<{}, {}, RecalcInput>(async (req, res) => {
      const result = deps.bonusService.recalcCosts(req.body.cfg, req.body.overrides);
      res.json(result);
    }),
  };
}
```

Wired in `app.ts`:

```typescript
import * as bonusService from './services/bonus.service.js';
const generateCtrl = createGenerateController({ bonusService });
app.post('/api/generate', apiLimiter, validate(GenerateSchema), generateCtrl.generate);
```

Apply same pattern to campaign and tournament controllers.

**Checklist:**
- [ ] `createGenerateController(deps)` factory
- [ ] `createCampaignController(deps)` factory
- [ ] `createTournamentController(deps)` factory
- [ ] Unit tests use mock deps instead of module mocks

---

### F9 — Observability: request ID + structured events

**Problem:** No correlation ID per request, no AI cost tracking, no latency metrics.

**Step 1 — Request ID middleware:**

```typescript
// src/middleware/requestId.ts
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) ?? randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}

// Augment Express Request type:
declare global {
  namespace Express {
    interface Request { requestId: string; }
  }
}
```

Add to `app.ts` before all other middleware.

**Step 2 — Structured AI event logging:**

```typescript
// src/ai/providers/anthropic.ts — after successful call:
logger.info({
  event:       'ai_generate',
  request_id:  req?.requestId,          // pass through opts
  model:       AI_MODEL,
  prompt_len:  prompt.length,
  output_len:  text.length,
  latency_ms:  Date.now() - start,
  attempt,
});
```

**Step 3 — AI cost tracking (token-based):**

```typescript
// Store usage from Anthropic response:
logger.info({
  event:          'ai_tokens',
  input_tokens:   response.usage.input_tokens,
  output_tokens:  response.usage.output_tokens,
  cost_usd:       estimateCost(response.usage),  // simple calc
});

function estimateCost(usage: { input_tokens: number; output_tokens: number }): number {
  // Haiku pricing: $0.80/M input, $4.00/M output (2026 rates — update as needed)
  return (usage.input_tokens / 1_000_000) * 0.80
       + (usage.output_tokens / 1_000_000) * 4.00;
}
```

**Checklist:**
- [ ] `src/middleware/requestId.ts` created and wired in `app.ts`
- [ ] `x-request-id` header on every response
- [ ] AI calls log: `event`, `model`, `latency_ms`, `attempt`
- [ ] AI calls log: `input_tokens`, `output_tokens`, `cost_usd`
- [ ] Extend `Request` type in global augmentation

---

## Phase 3 — Frontend build + CSP hardening

### F10 — Frontend: Vite build + remove unsafe-inline

**Problem:** `public/` contains 2000+ line self-contained HTML files with inline `<script>` blocks. This forces `scriptSrc: ["'unsafe-inline'"]` in CSP and makes the code hard to test.

**Review note:** *"This is the right time to do it — before more inline JS accumulates."*

**Target state:**

```
apps/
  frontend/               ← new: Vite project
    src/
      campaign-generator/
        main.ts
        components/
      configurator/
        main.ts
      tournament-generator/
        main.ts
      shared/
        i18n.ts
        api.ts
        sidebar.ts
    index.html
    vite.config.ts
  backend/               ← existing src/ relocated here
```

**Migration strategy (incremental — do not big-bang):**

Phase 3a — extract shared JS first:
1. Move `app.js` logic into `public/app.mjs` (ES module) → test it loads
2. Move campaign-generator inline JS into `public/campaign-generator.js`
3. Move tournament-generator inline JS into `public/tournament-generator.js`
4. Reference as `<script type="module" src="...">` — removes `unsafe-inline`

Phase 3b — introduce Vite:
1. Add `apps/frontend/` with `vite.config.ts`
2. Move extracted JS files into Vite src
3. Add `npm run build` → outputs to `public/dist/`
4. Backend serves `dist/` as static

Phase 3c — CSP hardening:
1. Remove `'unsafe-inline'` from `scriptSrc` and `scriptSrcAttr`
2. If needed: implement nonce injection middleware for any remaining inline scripts

**Checklist:**
- [ ] Phase 3a: all 3 HTML files load JS from external files (no inline scripts)
- [ ] `'unsafe-inline'` removed from Helmet CSP
- [ ] Phase 3b: Vite build working, `npm run build` produces `dist/`
- [ ] Phase 3c: CSP tightened to `'self'` + nonce only

---

### F11 — CI pipeline

**Files:** `.github/workflows/ci.yml` (or Vercel build hooks)

**Recommended pipeline steps:**

```yaml
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint          # add eslint if not present

      - name: Test
        run: npm test

      - name: Coverage threshold
        run: npm run test -- --coverage --reporter=text
        # enforce: lines > 70%, functions > 80%

      - name: Security audit
        run: npm audit --audit-level=high
```

**Also add to `package.json`:**

```json
"scripts": {
  "lint":      "eslint src --ext .ts",
  "typecheck": "tsc --noEmit",
  "test":      "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

**Checklist:**
- [ ] `.github/workflows/ci.yml` created
- [ ] ESLint configured (`@typescript-eslint/recommended`)
- [ ] Coverage thresholds enforced in CI
- [ ] `npm audit` step blocks on high-severity vulnerabilities

---

## Phase 4 — Production hardening (post-auth, post-growth)

These are tracked here for awareness but not yet in scope.

| Item | Description | Trigger |
|---|---|---|
| AI response caching | Cache identical prompt+params responses (Redis/KV). Saves cost on repeated generates. | When AI costs > $50/mo |
| Queue for heavy generation | Bull/BullMQ for texts+audit (currently synchronous, 3–8s). | When concurrent users > 20 |
| Rate limits per user | Per-authenticated-user limits instead of per-IP. | After auth (AUTH_WORKSPACE_DESIGN.md phase 1) |
| Idempotency keys | `x-idempotency-key` header for POST endpoints — prevent duplicate generations. | After billing |
| OpenAPI / Swagger | Auto-generate from Zod schemas via `zod-to-openapi`. Useful for future integrations. | Before public API |
| DB migration tooling | `node-postgres` + `db-migrate` or `drizzle-orm`. | After auth phase 1 |

---

## Implementation order (recommended)

```
Week 1:  Phase 1 — F1 (DTOs), F2 (env), F3 (asyncHandler), F4 (retry)
Week 2:  Phase 2 — F9 (observability), F5 (domain types), F6 (AI interface)
Week 3:  Phase 2 — F7 (use-cases), F8 (DI), F11 (CI)
Week 4+: Phase 3 — F10 (frontend build) — most disruptive, schedule carefully
Phase 4: after auth/workspace feature ships
```

---

## Files changed summary

| File | Change | Phase |
|---|---|---|
| `src/validation/*.schema.ts` | Export `z.infer` types | 1 |
| `src/controllers/*.ts` | Typed req.body, asyncHandler | 1 |
| `src/services/*.ts` | Typed function signatures | 1 |
| `src/config/index.ts` | EnvSchema, AI_MODEL constant | 1 |
| `src/middleware/asyncHandler.ts` | New file | 1 |
| `src/ai/providers/anthropic.ts` | Backoff, isRetryable, cost logging | 1+2 |
| `src/middleware/requestId.ts` | New file | 2 |
| `src/ai/interface.ts` | New file | 2 |
| `src/ai/registry.ts` | New file | 2 |
| `src/ai/providers/mock.ts` | New file | 2 |
| `src/domain/shared/` | Segment, Region, Currency types | 2 |
| `src/domain/bonus/BonusConfig.ts` | New typed interface | 2 |
| `src/use-cases/` | New directory, 3 files | 2 |
| `src/server/app.ts` | Wire requestId middleware, use factories | 2 |
| `public/*.html` | Extract inline JS to external files | 3 |
| `apps/frontend/` | Vite setup | 3 |
| `.github/workflows/ci.yml` | CI pipeline | 3 |
| `package.json` | lint, coverage scripts | 3 |
