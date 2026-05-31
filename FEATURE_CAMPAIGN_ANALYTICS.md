# FEATURE_CAMPAIGN_ANALYTICS.md

Campaign analytics feature spec — closing the forecast → actual loop. Updated: 2026-05-29.

---

## Overview

Operators record actual results for a previously generated campaign and compare
them against the forecast that was produced at generation time. The feature adds:

1. A **forecast snapshot** captured at generate time (so the prognosis is frozen and comparable later).
2. A way to **enter actuals** (manual MVP → CSV import → API integration as later adapters).
3. A pure **comparison function** (`compareCampaign`) that computes variance, forecast accuracy, real ROI, and risk flags.
4. Two **frontend views**: a single-campaign "forecast vs actual" card and a portfolio dashboard (live artifact).

Backend follows the existing `domain → service → controller → route` pattern.
Phase 1 is mostly frontend + one pure domain function; no DB required (extends
the existing `savedCampaigns` localStorage model).

---

## Data model

### Extend `savedCampaigns` entry (localStorage)

Current shape (key `savedCampaigns`): `{ id, name, params, mechanics, economics, overrides, createdAt, updatedAt }`.

Add two fields:

```typescript
interface SavedCampaign {
  // ...existing fields...
  forecastSnapshot?: ForecastSnapshot;  // frozen at generate/save time
  actuals?:          CampaignActuals;    // entered after campaign ends
}

interface ForecastSnapshot {
  capturedAt:   string;   // ISO timestamp
  geo:          string;
  segment:      'new' | 'mid' | 'vip';
  lic:          string;
  cur:          string;   // sitecur
  pl:           number;   // player count used in forecast
  costRatio:    number;   // econ.costRatio (P50)
  sP10:         number;   // econ.sP10.cost  (total, sitecur)
  sP50:         number;   // econ.sP50.cost
  sP90:         number;   // econ.sP90.cost
  conv:         { p10: number; p50: number; p90: number }; // 0.10 / 0.20 / 0.40
  lift:         number;   // incremental lift (0–0.40)
  incrPl:       number;   // forecast incremental players
  incrRev:      number;   // USD
  campCost3:    number;   // USD, 3-month campaign cost
  net:          number;   // USD, incrRev − campCost3
}

interface CampaignActuals {
  enteredAt:        string;  // ISO timestamp
  source:           'manual' | 'csv' | 'api';
  participants:     number;  // real players who took the bonus
  totalDeposits:    number;  // sitecur
  wagerCompleted:   number;  // 0–1, fraction of players who cleared wager
  bonusPayout:      number;  // sitecur, real total bonus cost
  incrPlayers:      number;  // real incremental/retained players (optional, default 0)
  incrRevenue:      number;  // USD, real incremental 3-month revenue (optional)
  notes?:           string;
}
```

### Capture point

In the existing save path (Configurator `app.js` and Campaign Generator), when the
campaign is generated/saved, populate `forecastSnapshot` from `_lastCfg.econ`
(Configurator) or the `/api/campaign/generate` response (Campaign Generator).
The incremental fields come from the v2 model already computed in
`_calcRetentionV2` / the CG IIFE (`lift`, `incrPl`, `incrRev`, `campCost3`, `net`).

---

## Domain function — `src/domain/analytics/compareCampaign.ts`

Pure function, no side effects (same discipline as `recalcCosts` / `calcEconomics`).

```typescript
export interface CampaignComparison {
  // Cost accuracy
  forecastCostP50:  number;     // snapshot.sP50 (sitecur)
  actualCost:       number;     // actuals.bonusPayout (sitecur)
  costVarianceAbs:  number;     // actual − forecastP50
  costVariancePct:  number;     // (actual − P50) / P50
  percentile:       'below_p10' | 'p10_p50' | 'p50_p90' | 'above_p90'; // where actual fell
  withinBand:       boolean;    // p10 ≤ actual ≤ p90

  // Behaviour accuracy
  forecastConvP50:  number;     // snapshot.conv.p50
  actualWagerCompl: number;     // actuals.wagerCompleted
  convVariancePct:  number;

  // Cost ratio
  forecastRatio:    number;     // snapshot.costRatio
  actualRatio:      number;     // bonusPayout / totalDeposits
  ratioVariancePct: number;

  // Incremental / ROI (USD)
  forecastNet:      number;     // snapshot.net
  actualNet:        number;     // actuals.incrRevenue − actualCampCostUSD (see note)
  netVarianceAbs:   number;
  roiActual:        number;     // actualNet / actualCampCostUSD

  // Risk flags
  flags: Array<'worse_than_worst_case' | 'better_than_best_case'
             | 'abuse_suspected' | 'data_incomplete'>;
}

export function compareCampaign(
  snap: ForecastSnapshot,
  act:  CampaignActuals
): CampaignComparison
```

### Calculation rules

- `percentile`: classify `act.bonusPayout` against `snap.sP10 / sP50 / sP90`.
- `withinBand = sP10 ≤ bonusPayout ≤ sP90`.
- `actualRatio = bonusPayout / totalDeposits` (guard division by zero → 0).
- Currency note: forecast cost fields are **sitecur**; `net`/`incrRev` are **USD**
  (per CLAUDE.md currency rules). Do NOT mix. ROI computed in USD only.
- Flags:
  - `worse_than_worst_case` → `bonusPayout > sP90`. Model under-estimated risk.
  - `better_than_best_case` → `bonusPayout < sP10`. Investigate abuse or bad data.
  - `abuse_suspected` → `actualWagerCompl < 0.5 × forecastConvP50` AND `actualRatio` high.
  - `data_incomplete` → any required actual is missing/zero where it shouldn't be.

---

## API

Follows existing route/controller/validate/service layering.

| Method | Path | Limiter | Schema | Handler |
|--------|------|---------|--------|---------|
| POST | `/api/campaign/actuals` | apiLimiter 30/min | `ActualsSchema` | `analytics.controller.saveActuals` |
| POST | `/api/campaign/analysis` | apiLimiter 30/min | `AnalysisSchema` | `analytics.controller.analyze` |

Note: storage stays client-side in Phase 1, so `/api/campaign/analysis` is a thin
stateless endpoint that accepts `{ forecastSnapshot, actuals }` and returns the
`CampaignComparison` (pure compute on the server, mirrors `/api/recalc`). The
`actuals` POST is optional in Phase 1 (frontend can call analysis directly); it
becomes meaningful once a DB is added.

### Files to add

- `src/domain/analytics/compareCampaign.ts` — pure function (above).
- `src/validation/analysis.schema.ts` — `AnalysisSchema` (forecastSnapshot + actuals), `ActualsSchema`.
- `src/services/analytics.service.ts` — thin wrapper calling `compareCampaign`.
- `src/controllers/analytics.controller.ts` — `analyze`, `saveActuals`.
- `src/routes/analytics.routes.ts` — mounted under `/api/campaign` in `app.ts`.

Optional AI layer (reuse existing infra): a `POST /api/campaign/analysis/explain`
that feeds the `CampaignComparison` into a short prompt (≈400 tokens, like
optimize) returning a 1–2 sentence "why it diverged" narrative.

---

## Frontend

### View 1 — single campaign "Forecast vs Actual" card

Reuse the existing audit-panel rendering style (`renderAuditPanel` in `app.js`):
P10/P50/P90 bars with an actual marker overlaid, cost-ratio bar (forecast vs
actual), variance chips, and flag badges (amber/red).

- **Actuals entry form**: 5 required inputs (`participants`, `totalDeposits`,
  `wagerCompleted`, `bonusPayout`, plus optional `incrRevenue`). Inline, on the
  saved-campaign detail screen.
- On submit → call `compareCampaign` (client-side import or `/api/campaign/analysis`)
  → render comparison card. Persist `actuals` back into the `savedCampaigns` entry.

### View 2 — portfolio dashboard (live artifact)

A persisted HTML artifact (`create_artifact`) that reads saved campaigns and shows:
forecast accuracy per campaign (percentile hit-rate), aggregate actual vs forecast
cost ratio, net result trend, and a flagged-campaigns list. Chart.js + Grid.js
allowed in artifacts. Reload button is built-in.

### i18n keys needed (all 4 languages: ru / en / mn / es)

- `sec_analytics` — "Анализ кампании" / "Campaign Analysis"
- `an_actuals_title`, `an_participants`, `an_deposits`, `an_wager_compl`, `an_payout`, `an_incr_rev`, `an_notes`
- `an_forecast`, `an_actual`, `an_variance`, `an_percentile`, `an_within_band`
- `an_flag_worst`, `an_flag_best`, `an_flag_abuse`, `an_flag_incomplete`
- `an_roi_actual`, `an_net_actual`
- `btn_save_actuals`, `btn_run_analysis`

---

## Tests — `tests/domain/compareCampaign.test.js`

Mirror `calcEconomics.test.js` coverage (~15–20 cases):

- actual lands in each band (below_p10 / p10_p50 / p50_p90 / above_p90)
- `withinBand` true/false boundaries (exactly = sP10, = sP90)
- cost ratio variance, division-by-zero guard (totalDeposits = 0)
- each flag triggers under the right condition; no false positives
- currency separation: USD net vs sitecur cost not mixed
- incomplete actuals → `data_incomplete` flag, no crash

---

## Phasing

**Phase 1 (MVP — frontend + 1 pure function):**
forecast snapshot at save → manual actuals form → `compareCampaign` + tests →
single-campaign comparison card. ~80% of the value, no DB. Establishes the data
format that CSV/API adapters map into later.

**Phase 2:** CSV import adapter (maps to `CampaignActuals`), portfolio dashboard artifact, optional AI "why it diverged" explanation.

**Phase 3:** DB/cloud persistence (depends on accounts — UX_RESEARCH R13), API
integration adapter, and model self-calibration: aggregate systematic bias in
`SEG_LIFT` / F1–F5 factors across N campaigns with actuals and tune per operator.

---

## Dependencies / cross-refs

- Currency rules and `econ` field semantics: see `CLAUDE.md` → "Core business logic" / "Currency note".
- Incremental v2 fields (`lift`, `incrPl`, `incrRev`, `campCost3`, `net`): `CLAUDE.md` → "Incremental Revenue v2".
- Cloud persistence prerequisite for Phase 3: `UX_RESEARCH.md` R13.
- Priority rationale (this is the #1 NOW feature): `FEATURE_PRIORITIZATION.md`.

---

## Session rule reminder

Per `CLAUDE.md`: no code changes without explicit user confirmation ("да"/"go"/
"реализуй"). This document is a spec only.
