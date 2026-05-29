# UX_DEV_PLAN.md — P0 + P1 Implementation Plan

Based on UX_RESEARCH.md recommendations R1–R8.
Date: 2026-05-29.

---

## Overview

| Priority | Items | Files touched | Estimated scope |
|---|---|---|---|
| P0 | R1, R2, R3, R4 | index.html, campaign-generator.html, tournament-generator.html, configurator.html, app.js, AI prompts | Large |
| P1 | R5, R6, R7, R8 | app.js, campaign-generator.html, tournament-generator.html | Medium |

Sequence: P0 → P1. Within P0, recommended order: R1 → R4 → R2 → R3 (R1 unlocks navigation for everything; R4 is quick and high-trust-impact; R2/R3 are bigger frontend work).

---

## P0 — R1: Единый хаб инструментов + сквозная навигация

**Problem:** Configurator has no direct link from landing. Tournament is only accessible from sidebar. Three tools feel like three unrelated products.

**Personas affected:** All.

### R1-A: Landing page — явные входы во все три инструмента

File: `public/index.html`

**Where:** Below the hero CTA buttons (before the marquee), add a "Tools" section with three cards:

```html
<!-- Three tool cards: Campaign Generator / Bonus Configurator / Tournament Generator -->
<!-- Each card: icon + short description + CTA button -->
<!-- Existing hero CTA button stays; new section adds navigation context -->
```

Each card:
- Campaign Generator: 🚀 "AI Campaign Generator" — "5-channel CRM copy + economics in 2 min"
- Bonus Configurator: ⚙️ "Bonus Configurator" — "P10/P50/P90 cost model, live recalc"
- Tournament Generator: 🏆 "Tournament Generator" — "Prize structure, economics, setup guide"

Add i18n for RU (both are already supported on landing).

**Where to insert:** After the hero section, before `<div class="marquee-wrap">`, add:

```html
<section id="tools" style="padding:48px 0 0">
  <div class="container">
    <div class="tools-grid"> <!-- 3-column CSS grid --> </div>
  </div>
</section>
```

---

### R1-B: Верхняя навигация на лендинге

File: `public/index.html`

Add a sticky top nav bar with links: `Tools` (anchor to #tools section) · `Campaign` · `Configurator` · `Tournament` · `Sign In (soon)`.

Currently the landing has no global nav — just a hero with a signup form.

---

### R1-C: Configurator sidebar — выровнять со структурой CG/TG

File: `public/configurator.html`

The Configurator (`/configurator.html`) has no sidebar at all — it is a standalone form. Add the same sidebar structure as `campaign-generator.html`:

```
[Main]
📊 Dashboard → /campaign-generator.html
📁 Campaigns → /campaign-generator.html
🏆 Tournaments → /tournament-generator.html

[Tools]
⚙️ Configurator (active)
🚀 Campaign Gen → /campaign-generator.html
🏆 Tournament Gen → /tournament-generator.html
📋 Setup Guide → /tournament-generator.html

[Soon]
📈 Analytics
⚙️ Settings
```

CSS for the sidebar already exists in `styles.css` (used by `configurator.html`). Wire up the sidebar via `app.js` or inline script.

---

### R1-D: Tournament entry on landing hero

File: `public/index.html`

Add secondary CTA button next to existing "Try Campaign Generator →":

```html
<a href="/tournament-generator.html" class="btn-secondary">Try Tournament Generator →</a>
```

---

**Acceptance criteria R1:**
- [ ] All three tools accessible within 1 click from landing
- [ ] Configurator has sidebar matching CG/TG structure
- [ ] User can navigate CG ↔ Configurator ↔ Tournament without going back to landing
- [ ] Active sidebar item correctly highlighted on each page

---

## P0 — R2: Приветственный/онбординг-экран

**Problem:** Users hit a 5-step wizard or dense form with no context of what they'll get.

**Personas:** Дарья (CRM, non-analyst), new users.

### R2-A: Campaign Generator welcome screen

File: `public/campaign-generator.html`

Show a welcome/onboarding screen on first load (when no `savedCampaigns` in localStorage, or always before step 1 for new sessions). The screen replaces step 1 of the wizard until dismissed.

```
┌─────────────────────────────────────────────────────┐
│  AI Campaign Generator                              │
│                                                     │
│  What you'll get in ~2 minutes:                    │
│                                                     │
│  1 → Pick scenario    Choose from 8 campaign types │
│  2 → Set parameters   Geo, segment, tone, risk     │
│  3 → See economics    Cost model + retention lift   │
│  4 → Get AI texts     Push · Email · SMS · TG · Pop│
│  5 → Compliance audit Passes / fails per license   │
│                                                     │
│            [Start →]                               │
│  Don't show again □                                │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Check `localStorage.getItem('cg_onboarding_done')` on init.
- If not set: render welcome card BEFORE renderStep1(), with "Start →" button that sets the flag and calls `goStep(1)`.
- "Don't show again" checkbox: if checked, persists across sessions; if not — shows every new session.

**i18n keys needed (RU + EN, add to I18N object):**
```
onb_title, onb_sub, onb_step1..5 (label + desc), onb_cta, onb_skip
```

---

### R2-B: Bonus Configurator first-use hint

File: `public/configurator.html` + `public/app.js`

Lighter touch: a dismissible top banner (not a full screen) on first load:

```
ℹ️  Choose a region and click Generate to get a full bonus spec with P10/P50/P90 cost model and incremental revenue forecast. [Got it ×]
```

State: `localStorage.getItem('cfg_hint_dismissed')`.

---

**Acceptance criteria R2:**
- [ ] New CG user sees welcome screen before step 1
- [ ] Welcome screen explains steps in plain language (no jargon)
- [ ] "Don't show again" works across sessions
- [ ] Configurator shows dismissible first-use hint

---

## P0 — R3: Прогрессивное раскрытие экономики (Basic / Expert)

**Problem:** Step 3 of Campaign Generator shows P10/P50/P90, 5-factor lift breakdown, cost per bonus, deposit load, wager completion — all at once. For CRM role, this causes drop-off.

**Personas:** Дарья (needs basic view), Алексей (needs expert view).

### R3-A: Campaign Generator Step 3 — Basic/Expert toggle

File: `public/campaign-generator.html`

**Basic mode (default):**
- Show 3 scenario cards (Best / Expected / Worst) with just: total campaign cost + expected conversion %
- One-line verdict: "Expected cost: EUR 1,234 · Conversion: 20% · ROI positive ✓"
- Incremental Revenue section: show only final `net` result with simple "+/- USD" colour
- Factor breakdown table collapsed/hidden
- Toggle: `[Show full analysis ▾]`

**Expert mode (on toggle click, persisted in `localStorage('cg_expert_mode')`):**
- Full current view: all 3 cards with 3 metrics + tooltips, full factor breakdown, cost ratio bar
- Toggle: `[Collapse ▴]`

**Implementation in `renderEconScenarios()`:**

```javascript
const expertMode = localStorage.getItem('cg_expert_mode') === '1';

// Basic view: simple 3-card grid (cost + conversion only)
// Expert view: current full render
// Toggle button at bottom of section
```

Segment picker defaults: `new` and `mid` segments → default to Basic; `vip` → default to Expert (VIP managers are typically more analytical).

---

### R3-B: Configurator incremental revenue section — collapsible

File: `public/app.js` — `_buildIncrRevBody()`

The 5-factor table (`_buildIncrRevBody`) is already detailed. Add a collapsible wrapper:

```javascript
// Default: show summary row only (lift %, net result, campCost3)
// "Show factor breakdown ▾" expands the full F1–F5 table
// State: localStorage 'cfg_incr_expert'
```

---

**Acceptance criteria R3:**
- [ ] Default Step 3 view (Basic) shows ≤ 5 data points without jargon
- [ ] Expert toggle reveals full current view
- [ ] Expert preference persisted across sessions
- [ ] VIP segment defaults to Expert

---

## P0 — R4: Дисклеймер и обоснование для AI-вывода

**Problem:** AI texts presented as facts; audit verdicts have no source reference; Compliance Officer (Томас) can't use the audit output in a real compliance process.

**Personas:** Томас (Compliance), Дарья.

### R4-A: AI texts — пометка «черновик»

File: `public/campaign-generator.html` — texts section render

Add a visible disclaimer above the 5-channel text output:

```html
<div class="alert alert-info" style="margin-bottom:12px">
  ✦ AI draft — review before sending. Verify regulatory strings match your platform's T&Cs.
</div>
```

RU equivalent. Not dismissible (permanent, lightweight).

---

### R4-B: Audit checks — ссылка на норму

Files:
- `src/ai/prompts/audit.prompt.ts`
- `src/ai/parser.ts` — `AuditResponseSchema`
- `public/campaign-generator.html` — audit render

**Schema change:** Add optional `rule` field to each check:

```typescript
// AuditResponseSchema — add to each check item:
rule: z.string().optional()  // e.g. "DGA §4.2 — max prize 1,000 DKK"
```

**Prompt change** (`buildAuditPrompt`): instruct the model to include a `rule` field citing the specific regulatory reference for each check. Example:

```
For each check, include a "rule" field: the specific regulation, clause, or standard being verified.
Examples: "MGA/CRP/2016 §3.2 – wagering disclosure", "DGA – Spillemyndigheden bonus cap DKK 1,000",
"UKGC LCCP SR Code 5.1.1 – no countdown timers".
```

**Frontend render:** Display `rule` as a muted sub-line under each check label:

```html
<div class="audit-check">
  <div class="audit-status ok">✓</div>
  <div>
    <div class="audit-label">DKK cap compliance</div>
    <div class="audit-norm">DGA – Spillemyndigheden bonus cap DKK 1,000</div>  ← new
    <div class="audit-note">Bonus max is set to 1,000 DKK. ✓</div>
  </div>
</div>
```

CSS: `.audit-norm { font-size:.72rem; color:var(--accent); opacity:.7; margin-bottom:2px; }`

---

### R4-C: Tournament audit — та же схема

File: `src/ai/prompts/tournament-audit.prompt.ts`

Apply same `rule` field to tournament audit prompt. Already uses similar structure.

---

### R4-D: Audit timestamp

File: `public/campaign-generator.html` — audit render

Show a small "Audited: [timestamp] · Rules version: [YYYY-MM]" line at the bottom of the audit panel.

```javascript
// After audit renders, append:
const ts = new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
// "Audited: 29 May 2026, 14:23 · Rules version: 2026-05"
```

---

**Acceptance criteria R4:**
- [ ] AI texts section has visible "AI draft" disclaimer (RU + EN)
- [ ] Each audit check shows `rule` source reference
- [ ] Audit panel shows timestamp
- [ ] Same applied to Tournament audit (step 4)
- [ ] `AuditResponseSchema` updated with optional `rule` field

---

## P1 — R5: Прозрачность модели (тултипы + «Допущения модели»)

**Problem:** Алексей doesn't trust a model he can't see. `lift 18%` with no derivation is a black box.

### R5-A: Incremental Revenue — раскрываемый блок «Assumptions»

File: `public/app.js` — `_buildIncrRevBody()`

Add a collapsible "Model assumptions" block below the factor table:

```
[ℹ Model assumptions ▾]

Base lift rates: New players 25% · Mid 18% · VIP 12%
Cap: max 40% retention lift
F1 (Wager): score > 1 when beW < wagerX (player-friendly)
F2 (Generosity): neutral at 50% match, +15% at 100%
F3 (Mechanics): +6% NDB, +8% Reload, +7% Cashback, +4% Dep2, +4% FS
F4 (RTP): range 85%–99%, centred at 92%
F5 (Platform): Mobile +5%, Desktop −3%, Both 0%
ARPU benchmark: [geo]-specific (EU: $65, CIS: $22, MN: $12)
```

State: `localStorage('cfg_model_expand')`.

**Same block in campaign-generator.html** inside the incremental IIFE.

---

### R5-B: Тултипы у ключевых терминов

Files: `public/app.js`, `public/campaign-generator.html`

Already have a `.tip` CSS class with `data-tip` tooltips. Expand coverage to ensure these terms always have tooltips:

| Term | Tooltip text (EN) |
|---|---|
| `wager` | Number of times the bonus amount must be bet before withdrawal |
| `cost ratio` | Total bonus payouts ÷ total deposit volume (dimensionless) |
| `P10 / P50 / P90` | Optimistic (10% of outcomes worse) / Base / Pessimistic scenario |
| `lift` | Estimated increase in player retention due to the bonus program |
| `breakeven wager` | Wager multiplier at which expected player payout equals bonus size |
| `WCR` | Weighted Contribution Rate — effective RTP across bet mix |
| `ARPU` | Average Revenue Per User per month (USD benchmark) |

In `app.js`: ensure all metric labels in `econBody` and `incrRevBody` use `data-tip`. Audit current coverage and fill gaps.

In `campaign-generator.html`: same audit on Step 3 economic cards.

---

### R5-C: P10/P50/P90 label clarification

File: `public/campaign-generator.html` — `renderEconScenarios()`

Currently shows "Best case / Expected / Worst case" without explaining what determines the scenario. Add sub-label:

```
Best case (conv. 10%)     Expected (conv. 20%)     Worst case (conv. 40%)
```

Where `conv` = player bonus completion rate driving the scenario.

---

**Acceptance criteria R5:**
- [ ] "Model assumptions" collapsible block in Configurator incremental section
- [ ] Same block in Campaign Generator Step 3
- [ ] All 7 key terms have tooltips across both tools
- [ ] P10/P50/P90 cards show conversion rate sub-label

---

## P1 — R6: Индикатор устаревших данных (stale econ)

**Problem:** Changing player count slider after Generate doesn't retrigger economics recalc. Алексей catches the discrepancy → loses trust.

**This is the documented tech debt item in CLAUDE.md ("P2 — Stale econ data UX").**

### R6-A: Stale indicator in Configurator

File: `public/app.js`

Track which fields affect `Generate` output vs which affect only `recalc`:

**Generate-sensitive fields** (changing these makes econ stale): `region`, `players`, `sitecur`, `depcur`, `avgdep`, `plat`, `lic`, `rtp`, `segment`, `riskAdj`.

**Implementation:**

```javascript
// After render(c) — save snapshot of generate-sensitive state:
window._lastGenerateState = captureGenerateState();

function captureGenerateState() {
  return JSON.stringify({
    region: S.region, players: gv('players'), sitecur: S.sitecur,
    depcur: S.depcur, avgdep: gv('avgdep'), plat: S.plat,
    lic: S.lic, rtp: gv('rtp'), segment: S.segment,
  });
}

// On any input change that is generate-sensitive, call:
function checkStale() {
  if (!_lastCfg) return;  // nothing generated yet
  const isStale = captureGenerateState() !== window._lastGenerateState;
  const el = document.getElementById('stale-banner');
  if (el) el.style.display = isStale ? 'flex' : 'none';
}
```

**Stale banner** — insert into `configurator.html` economics section, hidden by default:

```html
<div id="stale-banner" style="display:none; align-items:center; gap:10px;
     background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2);
     border-radius:8px; padding:8px 14px; margin-bottom:12px; font-size:.8rem; color:#f59e0b">
  ⚠ Parameters changed — click Generate to update economics
  <button onclick="generate()" style="margin-left:auto; ...">Generate ↻</button>
</div>
```

Wire `checkStale()` to `oninput` / `onchange` of all generate-sensitive fields (the same fields already have `oninput` for other purposes; just add `checkStale()` call).

---

### R6-B: Stale indicator in Campaign Generator

File: `public/campaign-generator.html`

Simpler: the `players` slider in Step 2 directly affects `activePl` used in the incremental block in Step 3. When Step 3 is showing and user hasn't regenerated after changing the slider, the metric can be stale.

Add a visual indicator inside the incremental revenue block:

```javascript
// After draft.params.players changes (slider oninput):
if (step === 3) {
  const el = document.getElementById('incr-stale');
  if (el) el.style.display = 'inline';
}
```

HTML: small inline badge next to "Incremental Revenue" section title:

```html
<span id="incr-stale" style="display:none; font-size:.7rem; padding:1px 7px;
  border-radius:99px; background:rgba(245,158,11,.15); color:#f59e0b">
  ↻ regenerate for updated forecast
</span>
```

---

**Acceptance criteria R6:**
- [ ] Changing any generate-sensitive field in Configurator after Generate shows amber stale banner
- [ ] Banner has inline "Generate ↻" button
- [ ] Banner disappears after Generate completes
- [ ] Campaign Generator incremental block shows stale badge when players slider changes after Step 3 load

---

## P1 — R7: Глоссарий терминов

**Problem:** `wager`, `RTP`, `WCR`, `breakeven`, `P10/P50/P90`, `lift`, `cost ratio` — not explained anywhere as a unified reference.

### R7-A: Sidebar glossary panel (shared across CG + TG)

File: `public/campaign-generator.html`, `public/tournament-generator.html`

Add a "?" help button in the topbar (top-right). Clicking opens a slide-in glossary panel (right drawer, `position:absolute` within `.main` — not `fixed`, to avoid iframe height issues):

```
┌────────────────────────────┐
│ Glossary                 × │
│                            │
│ Wager (wagering)           │
│   Times bonus must be bet  │
│   before withdrawal.       │
│                            │
│ RTP (Return to Player)     │
│   % of bets returned as    │
│   winnings. 96% = typical. │
│ ...                        │
└────────────────────────────┘
```

Terms in all 4 languages (RU/EN/MN/ES). Add to `I18N` object in `campaign-generator.html` and to `LANG` in `app.js`.

**Terms to include (11 total):**

| Key | EN | RU |
|---|---|---|
| `gl_wager` | Wager — times bonus must be bet before withdrawal | Вейджер — количество раз прокрутки бонуса |
| `gl_rtp` | RTP — % of total bets returned as winnings | RTP — доля ставок, возвращённых игрокам |
| `gl_wcr` | WCR — weighted RTP across actual bet mix | WCR — взвешенный RTP по реальной структуре ставок |
| `gl_p50` | P50 — base scenario (median expected outcome) | P50 — базовый сценарий |
| `gl_p10` | P10 — optimistic (only 10% of outcomes are better) | P10 — оптимистичный сценарий |
| `gl_p90` | P90 — pessimistic (only 10% of outcomes are worse) | P90 — пессимистичный сценарий |
| `gl_lift` | Retention lift — % increase in active player count from bonus | Прирост удержания — рост доли активных игроков |
| `gl_cost_ratio` | Cost ratio — bonus payouts ÷ total deposit volume | Коэффициент стоимости — выплаты по бонусам ÷ депозиты |
| `gl_breakeven` | Breakeven wager — wager at which expected payout = bonus size | Безубыточный вейджер |
| `gl_arpu` | ARPU — Average Revenue Per User per month (USD benchmark) | ARPU — средняя выручка с игрока в месяц |
| `gl_cac` | CAC — Customer Acquisition Cost per new player (USD) | CAC — стоимость привлечения одного игрока |

---

### R7-B: Configurator — same glossary

File: `public/app.js`

Add glossary toggle button to Configurator topbar. Reuse same term set, pull from `LANG` dictionary.

---

**Acceptance criteria R7:**
- [ ] "?" button in topbar of CG and Configurator
- [ ] Glossary panel opens inline (not fixed overlay)
- [ ] 11 terms defined in RU + EN
- [ ] Panel dismissible with × and clicking outside

---

## P1 — R8: «Последняя миля» — экспорт PDF + копирование текстов

**Problem:** Мария (consultant) can't hand campaign output to a client. Томас can't attach audit to compliance documentation.

### R8-A: Копирование текстов канала в один клик

File: `public/campaign-generator.html` — texts section

Add "Copy all [channel]" button per channel (push/email/sms/telegram/popup), next to channel tab:

```javascript
function copyChannel(channel) {
  const variants = lastTexts[channel];
  const text = variants.map((v, i) => `--- Variant ${i+1} ---\n${
    typeof v === 'object' ? `Subject: ${v.subject}\n\n${v.body}` : v
  }`).join('\n\n');
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
}
```

Button: `[⎘ Copy all]` — small, right-aligned in tab header row.

Also: existing "Copy" buttons on individual variants already work — this is an addition, not replacement.

---

### R8-B: Export campaign to PDF

File: `public/campaign-generator.html`

Add "Export PDF" button at the top of Step 3 results and again at Step 4 (after texts + audit generated).

**Implementation — browser print-to-PDF approach** (no server-side dependency):

```javascript
function exportCampaignPDF() {
  // Build a print-friendly HTML string with:
  // - Campaign name (scenario + geo)
  // - Economics summary (Best/Expected/Worst)
  // - Incremental Revenue outcome
  // - AI texts (all channels, all variants) — if generated
  // - Audit results with rule citations — if run
  // - Footer: "Generated by BonusEngine · [timestamp] · bonusengine.io"
  
  const win = window.open('', '_blank');
  win.document.write(buildPrintHTML());
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
```

`buildPrintHTML()` builds a self-contained HTML page with inline styles, no external resources. Uses `window.print()` which triggers browser "Save as PDF" dialog.

**What the PDF contains:**
1. Header: scenario name, geo, date
2. Economics table: 3 scenarios with costs + conversion
3. Incremental Revenue summary (net result)
4. AI texts (if available): by channel, 3 variants each
5. Compliance audit (if available): all 5 checks with rule references
6. Footer with timestamp

---

### R8-C: Export tournament results to PDF

File: `public/tournament-generator.html`

Same approach. Add "Export PDF" button in:
- Step 3 nav-footer (tournament economics)
- Setup Guide view

The PDF includes: tournament spec summary, prize table, economic scenarios, setup checklist, launch timeline.

---

### R8-D: Export audit as standalone PDF

File: `public/campaign-generator.html`

Add a secondary "Export Audit" button specifically in the audit panel. The audit PDF is minimal: scenario + license + date + 5 checks with rule citations + recommendations. This is the document Томас needs for compliance documentation.

---

**Acceptance criteria R8:**
- [ ] "Copy all" button per channel in CG texts section
- [ ] "Export PDF" in CG Step 3 + Step 4 (full campaign)
- [ ] "Export Audit" in CG audit panel (compliance doc)
- [ ] "Export PDF" in Tournament Step 3 + Setup Guide
- [ ] PDF footer includes timestamp and "Generated by BonusEngine"
- [ ] No external dependencies (pure browser print)

---

## Implementation sequence

### Phase 1 (P0 quick wins — 1–2 days)

| Task | File(s) | Effort |
|---|---|---|
| R4-A: AI texts draft disclaimer | campaign-generator.html | 30 min |
| R4-D: Audit timestamp | campaign-generator.html | 30 min |
| R1-D: Tournament CTA on landing | index.html | 30 min |
| R6-A (stub): Stale banner HTML | configurator.html | 1h |
| R2-B: Configurator first-use hint | configurator.html, app.js | 1h |

### Phase 2 (P0 core — 2–3 days)

| Task | File(s) | Effort |
|---|---|---|
| R4-B: Audit `rule` field in schema + prompt | audit.prompt.ts, parser.ts, campaign-generator.html | 2h |
| R4-C: Tournament audit same | tournament-audit.prompt.ts | 30 min |
| R1-A: Landing tools section | index.html | 2h |
| R1-C: Configurator sidebar | configurator.html, app.js | 3h |
| R2-A: CG welcome screen | campaign-generator.html | 2h |

### Phase 3 (P0 complex — 2–3 days)

| Task | File(s) | Effort |
|---|---|---|
| R3-A: CG Basic/Expert toggle | campaign-generator.html | 3h |
| R3-B: Configurator incr. collapsible | app.js | 1h |
| R6-A full: Stale detection logic | app.js | 2h |
| R6-B: CG stale badge | campaign-generator.html | 1h |

### Phase 4 (P1 — 2–3 days)

| Task | File(s) | Effort |
|---|---|---|
| R5-A: Model assumptions block | app.js, campaign-generator.html | 2h |
| R5-B: Tooltip coverage audit | app.js, campaign-generator.html | 2h |
| R5-C: P50 card conv sub-label | campaign-generator.html | 30 min |
| R7-A/B: Glossary panel | campaign-generator.html, app.js | 3h |
| R8-A: Copy channel button | campaign-generator.html | 1h |
| R8-B: Campaign PDF export | campaign-generator.html | 3h |
| R8-C: Tournament PDF export | tournament-generator.html | 2h |
| R8-D: Audit PDF export | campaign-generator.html | 1h |

---

## Not in scope (P2/P3 — separate plan)

- R9: UI unification across tools (visual language consistency)
- R10: Aggression/risk control consolidation
- R11: Side-by-side geo comparison
- R12: Landing localisation MN/ES
- R13: Accounts + cloud storage (tracked in AUTH_WORKSPACE_DESIGN.md)
- R14: CRM platform integrations

---

## Files changed summary

| File | Changes |
|---|---|
| `public/index.html` | Tools section, nav, tournament CTA |
| `public/configurator.html` | Sidebar, first-use hint, stale banner |
| `public/app.js` | Stale detection, glossary, model assumptions, tooltip coverage, incremental collapsible |
| `public/campaign-generator.html` | Welcome screen, Basic/Expert toggle, AI draft disclaimer, audit rule display, copy-channel button, PDF export, stale badge, glossary |
| `public/tournament-generator.html` | Audit rule display, PDF export |
| `src/ai/prompts/audit.prompt.ts` | Add `rule` field instruction |
| `src/ai/prompts/tournament-audit.prompt.ts` | Add `rule` field instruction |
| `src/ai/parser.ts` | `AuditResponseSchema` — add `rule?: string` to check items |
