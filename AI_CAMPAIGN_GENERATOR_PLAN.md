# AI CRM Campaign Generator — Plan & Context

> Briefing document for Claude Code. Read this before starting any work.

## What we're building

A new feature on top of the existing Bonus Engine Configurator: an **AI-powered 5-step campaign creation wizard** for iGaming CRM managers. The wizard generates bonus mechanics, multi-channel marketing texts, compliance checks, and exports — all driven by AI.

UI reference: see `CAMPAIGN_FLOW_UI.png` in this folder (9-screen mockup).

---

## Existing codebase

```
/Bonus system/
  server.js              # Express server, buildConfig() — core bonus logic to reuse
  public/
    index.html           # Main UI (server-based version)
    app.js               # Frontend logic, LANG i18n dictionary (EN/RU/MN/ES)
    styles.css
  bonus-configurator.html  # Standalone single-file version (needs to be restored)
  landing.html           # Landing page (just built) — links to ./public/index.html
  CLAUDE.md              # Codebase instructions
```

`buildConfig(params)` in server.js is a pure function that generates full bonus configs for 6 regions (CIS, EU/UKGC, Crypto, Sweep, MN, LatAm). **Reuse it** in the campaign generator — don't rewrite.

---

## AI API decision

**Use Anthropic Claude API** (not OpenAI):
- Model: `claude-haiku-4-5-20251001` for cost efficiency (~$0.001/campaign)
- $5 free credits on signup at console.anthropic.com
- Better structured JSON output for bonus configs
- Better iGaming regulatory compliance in generated texts

API key: to be provided by user (not yet registered).

Set in `.env` as `ANTHROPIC_API_KEY=...`

---

## Architecture

```
Frontend (SPA)          Backend (server.js extensions)       AI Layer
─────────────────       ──────────────────────────────       ──────────────
Dashboard               POST /api/campaign/generate    →     Claude API
5-step Wizard           GET  /api/campaigns                  3 prompts:
  Step 1: Scenario      POST /api/campaign/export              1. Mechanic selection
  Step 2: Params                                               2. Text generation
  Step 3: AI Gen        Reuses buildConfig() internally        3. Risk audit
  Step 4: Texts+Audit
  Step 5: Export
```

**State:** Single `campaignDraft` object flows through all steps. Persisted to localStorage for history.

---

## The 5-Step Wizard

### Step 1 — Scenario Selection
User picks campaign type from categories + specific scenario.

Categories: Реактивация / Депозиты / VIP / Спорт / Турниры / Другое

Scenarios (examples):
- Реактивация: Неактивен 3 дня, Неактивен 7 дней, Неактивен 30+ дней, Риск оттока, Вернуть после выигрыша, Вернуть после проигрыша
- Депозиты: Первый депозит, Второй депозит, Крупный депозит
- VIP: VIP удержание, VIP реактивация
- Спорт: Спортивное событие
- Турниры: Турнир/Ивент

Output: `{ scenarioId, category, label }`

### Step 2 — Campaign Parameters
Fields:
- Гео (country, e.g. Germany DE)
- Вертикаль (Casino / Sports)
- Сегмент игроков (Новые / Средние / VIP)
- Предпочтительные игры (Слоты / Настольные / Live)
- Бюджет кампании (€ amount)
- Тон коммуникации (Дружелюбный / Профессиональный / Агрессивный)
- Агрессивность предложения (Низкая / Средняя / Высокая) — 3-way toggle
- Риск-уровень (Низкий / Средний / Высокий) — 3-way toggle
- Язык коммуникации (dropdown, matches geo)

Maps to existing buildConfig params: region, lic, avgdep, plat, rtp, wagerX

### Step 3 — AI Generation (animated progress screen → results)

**Progress screen** (sequential checkboxes with animation):
1. ✓ Анализ сценария
2. ✓ Подбор механики бонуса
3. ✓ Генерация условий
4. ✓ Создание текстов
5. ⟳ Проверка на риски и рекомендации

**Results screen:**
- Generated bonus mechanic (type, pct, maxB, wager) — from buildConfig()
- AI explanation: why this mechanic for this scenario (3-4 bullet points)
- Alternative options: Фриспины +30 / Депозитный буст / Кешбек альтернатива (clickable chips)

### Step 4 — Texts & Audit (two sub-screens)

**4a — AI Texts:**
Channel tabs: Push / Email / SMS / Telegram / On-site popup
Each channel: 3 variants A/B/C
"Сгенерировать ещё варианты" button
Character counter (e.g. 96/160 for SMS)

**4b — Review & Recommendations:**
Audit checklist (auto-generated):
- Условия бонуса ✓/⚠
- Риски злоупотреблений ✓/⚠
- Соответствие правилам ✓/⚠
- Локализация ✓/⚠
- UX и дизайн ✓/⚠

AI recommendations panel with "Применить" buttons.

### Step 5 — Export & Done

**Export formats** (no Jira — excluded from MVP):
- JSON (for developers)
- CSV / Excel (for CRM import)
- Копировать в буфер (copy all)
- Email в CRM (mailto link)
- API (show curl command)

Campaign summary card on the right.

**Final "Готово!" screen:**
- "Кампания успешно создана! 🎉"
- Two buttons: "Перейти к кампании" / "Создать ещё одну"

---

## Dashboard

Entry point. Contains:
- Header: "Добро пожаловать!" + "Создать кампанию" button
- Quick start grid (6 template cards with icons):
  Реактивация, Reload кампания, Cashback кампания, VIP удержание, Спортивное событие, Турнир/Ивент
- Recent campaigns table: Name / Type / Status / Date
  Statuses: Черновик / Активна / Завершена

Sidebar navigation (always visible):
- Дашборд
- Кампании
- Шаблоны (Playbooks)
- Сценарии
- Календарь
- AI Ассистент
- Аналитика (скоро)
- Настройки (скоро)

---

## Data model

```javascript
const Campaign = {
  id: 'uuid',
  name: 'Weekend Reload DE',
  status: 'draft' | 'active' | 'completed',
  scenario: { id, category, label },
  params: {
    geo, vertical, segment, budget,
    tone, aggression, riskLevel, lang,
    // mapped to buildConfig: region, lic, avgdep, plat, rtp, wagerX
  },
  mechanics: {
    // output of buildConfig() welcome/reload/ndb etc.
    type, pct, maxB, wager, fs, days, cur
  },
  aiExplanation: ['bullet1', 'bullet2', 'bullet3'],
  texts: {
    push: ['varA', 'varB', 'varC'],
    email: ['varA', 'varB', 'varC'],
    sms: ['varA', 'varB', 'varC'],
    telegram: ['varA', 'varB', 'varC'],
    popup: ['varA', 'varB', 'varC'],
  },
  audit: {
    checks: [{ label, status: 'ok'|'warn', note }],
    recommendations: [{ text, applied: false }],
  },
  createdAt, updatedAt
}
```

---

## Development Phases

### Phase 1 — Shell (start here)
- Dashboard layout with sidebar
- Wizard shell with 5 steps and navigation
- Step 1: Scenario selection (static data, no AI)
- Step 2: Parameters form
- Mock data for steps 3–5
- No AI calls yet — fully clickable prototype

### Phase 2 — Mechanics
- Wire buildConfig() into Step 2→3
- Real bonus mechanics on results screen
- Unit economics from existing model

### Phase 3 — AI Texts
- Claude API integration (ANTHROPIC_API_KEY from .env)
- Prompts for text generation per channel
- A/B/C variants, streaming response
- "Generate more" button

### Phase 4 — Audit & Export
- AI audit checks + recommendations
- Export: JSON, CSV, Copy, Email, API curl
- "Done" screen

### Phase 4.5 — Campaign Detail View
- Campaigns list page (separate from dashboard widget)
- Full-screen detail view with 5 tabs: Обзор / Механика / Тексты / Аудит / Экспорт
- Status badges with color coding
- Actions: Edit (re-open wizard), Duplicate, Export dropdown, Archive
- Edit mode: wizard pre-filled with existing campaign data
- Row hover actions in the list (duplicate, archive icons)
- Future: right-side drawer for quick preview (not MVP)

### Phase 6 — Open Saved Campaign in Configurator ✅ DONE
- Created `public/configurator.html` — full standalone configurator page with form UI (all region cards, sliders, chip selectors, currency dropdowns) using existing `styles.css` + `app.js`
- **Save Campaign button** — appears in output header after generation; opens modal to name the campaign
- **Saved Campaigns drawer** — slide-in panel from the right, shows all saved campaigns with region badge, license, mechanic summary, date; accessible via nav button with count badge
- **Open in Configurator** — per-campaign button in the drawer: re-applies all params (pickRegion, setChip, syncRtp, etc.), shows campaign context banner, auto-generates and injects wager override
- **localStorage persistence** — campaigns stored under `bonusCampaigns` key, survive page refresh
- **i18n** — all new strings in RU/EN/MN/ES
- **Route** — `/configurator` → `/configurator.html` added to server.js
- **Integration with campaign generator (Phase 4.5)** — the generator's detail view calls `buildConfiguratorURL()` from `app.js`, which encodes all params as URL query string; `initFromCampaignURL()` reads them on load and pre-fills + auto-generates

### Phase 5 — Polish
- Campaign history in localStorage
- Status management
- i18n EN/RU
- Mobile layout

---

---

## Campaign Detail View

Full-screen detail page opened from the campaign list. MVP approach: full-screen only (no drawer). Drawer-style quick preview is a future optimization.

### Navigation
- Click on any row in the campaigns table → opens full-screen detail view
- Header has ← Back button returning to the list
- Row shows enough info without opening: name, scenario type, geo+lang, status badge, created date, hover actions (duplicate, archive)

### Status badges (color-coded)
- Черновик → grey
- Активна → green
- Завершена → dark/muted

### Layout

```
┌─ Header ───────────────────────────────────────────────────┐
│  ← Назад к кампаниям  [Campaign Name]  [Status badge]      │
│                               [Дублировать] [Экспорт ▼] [Редактировать] │
├─ Tabs ─────────────────────────────────────────────────────┤
│  Обзор  |  Механика  |  Тексты  |  Аудит  |  Экспорт      │
├────────────────────────────────────────────────────────────┤
│  Tab content (see below)                                   │
└────────────────────────────────────────────────────────────┘
```

### Tab contents

**Обзор** — summary cards grid: scenario, geo, player segment, budget, tone, aggression level, risk level, language, created/updated dates.

**Механика** — generated bonus spec (type, %, maxB, wager, FS, validity days, currency) + AI explanation bullets (why this mechanic was chosen for the scenario).

**Тексты** — channel tabs: Push / Email / SMS / Telegram / On-site popup. Each shows all 3 variants A/B/C, selected variant highlighted. User can switch selected variant.

**Аудит** — checklist with check results (ok/warn per item) + AI recommendations with "Применить" buttons. Shows which recommendations were already applied.

**Экспорт** — same export options as in the wizard (JSON, CSV/Excel, Copy, Email to CRM, API curl). Available at any time, not just during creation.

### Actions available from detail view
- **Редактировать** — re-opens the wizard pre-filled with campaign data (edit mode)
- **Дублировать** — creates a copy as new draft, opens wizard pre-filled
- **Экспорт** — dropdown with all export formats
- **Архивировать** — changes status to Завершена, confirms with dialog

### Future enhancement (not MVP)
Right-side drawer for quick preview without leaving the list — slide in on row click, show summary + quick actions, "Открыть полностью" ↗ button to go to full detail page.

---

---

## Open in Configurator Feature

Allows opening any saved campaign directly in the Bonus Configurator with all parameters pre-filled. User can tweak params and recalculate economics without affecting the saved campaign.

### How it works

1. In the campaign detail view header, there is an **"Открыть в конфигураторе"** button.
2. Clicking it calls `buildConfiguratorURL(campaignParams, true)` (from `app.js`) and opens the URL in a new tab.
3. The configurator reads URL params via `initFromCampaignURL()` (already implemented in `public/app.js`), pre-fills all form fields, and auto-generates the spec.
4. A **campaign context banner** appears fixed at the top showing:
   - ← Back to Campaign button
   - Campaign name + wager badge
   - Note: "Changes here are not auto-saved to the campaign"

### URL format

```
/public/index.html?cid={id}&name={encoded_name}&region={region}&players={n}
  &avgdep={n}&sitecur={cur}&depcur={cur}&lic={lic}&plat={plat}&rtp={n}&wager={n}&autogen=1
```

### Already implemented in `public/app.js`

- `initFromCampaignURL()` — reads URL params, pre-fills form, shows banner, auto-generates
- `buildConfiguratorURL(campaignParams, autoGenerate)` — builds the URL from a campaign object (call this from the generator frontend)
- `_showCampaignBanner(cid, name, wager)` — renders fixed top banner with back-link

### Campaign params mapping

| Campaign field | URL param | Configurator state |
|---|---|---|
| params.region | `region` | `S.region` via `pickRegion()` |
| params.players | `players` | `S.players` |
| params.avgdep | `avgdep` | `S.avgdep` |
| params.sitecur / depcur | `sitecur` / `depcur` | `S.sitecur` / `S.depcur` |
| params.lic | `lic` | `S.lic` via `setChip()` |
| params.plat | `plat` | `S.plat` via `setChip()` |
| params.rtp | `rtp` | `S.rtp` |
| mechanics.wager | `wager` | injected into `ov_w_wager` after generate |
| campaign.id | `cid` | back-link only |
| campaign.name | `name` | shown in banner |

### What the campaign generator needs to do (Phase 4.5)

Add this button to the campaign detail view header:
```javascript
const url = buildConfiguratorURL({
  id: campaign.id,
  name: campaign.name,
  region: campaign.params.region,
  players: campaign.params.players,
  avgdep: campaign.params.avgdep,
  sitecur: campaign.params.sitecur,
  depcur: campaign.params.depcur,
  lic: campaign.params.lic,
  plat: campaign.params.plat,
  rtp: campaign.params.rtp,
  wager: campaign.mechanics.wager,
}, true);
window.open(url, '_blank');
```

### Deferred (not in MVP)

- "Save back to campaign" button in configurator — updates campaign mechanics with tweaked values via shared localStorage key
- Diff view showing what changed vs. original campaign params

---

## Where to start

1. Read `CLAUDE.md` for project conventions
2. Read `server.js` to understand buildConfig() — you'll reuse it
3. Start with Phase 1: create `campaign-generator.html` as standalone file (same pattern as bonus-configurator.html)
4. Ask user for ANTHROPIC_API_KEY before Phase 3

## Design language
- Dark theme matching landing.html: bg #0a0d14, card #161c2d, accent #4f6ef7/#7c3aed
- Primary purple/blue gradient for CTAs
- Sidebar: dark navy #0f1420
- Active step: filled gradient circle
- Completed step: green checkmark
- Font: Inter / system-ui
