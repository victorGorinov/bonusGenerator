# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm start          # starts Express on http://localhost:3000
PORT=8080 npm start  # custom port
```

No build step — the server serves `public/` as static files directly.

## Architecture

**Bonus Engine Configurator v2.0** — a casino bonus admin spec generator for iGaming operators.

### Data flow

1. User sets parameters in the left panel (`public/index.html` + `public/app.js`)
2. Frontend posts to `POST /api/generate` with `{ region, players, sitecur, depcur, avgdep, plat, lic, rtp, wagerX }`
3. `buildConfig(params)` in `server.js` returns a config object
4. Frontend renders the config as a structured spec sheet in the right panel

### Core business logic — `server.js`

`buildConfig()` is a pure computation function (exported for testing). It builds a full bonus program config for six regions:

| Region key | Market |
|---|---|
| `cis` | CIS (RU/UA/KZ), fiat |
| `eu` | EU/UK, fiat; sub-divided by license (`mga`, `ukgc`) |
| `crypto` | Global crypto (BTC/ETH/USDT) |
| `sweep` | USA sweepstakes (SC/GC coins) |
| `mn` | Mongolia, MNT fiat |
| `latam` | Latin America, USD fiat |

The function returns sections: `welcome`, `dep2`, `dep3`, `ndb`, `reload`, `wager`, `cashback`, `contrib`, `fsSpec`, `econ`, `reg`.

`econ` contains unit economics (ARPU, CAC, LTV, ROI, bonus cost scenarios P10/P50/P90).

### Frontend — `public/app.js`

- Large `LANG` dictionary at the top holds all UI strings for 4 languages: `ru`, `en`, `mn`, `es`
- `data-i18n="key"` attributes on HTML elements; `setLang(code)` swaps all text
- `generate()` calls the API and passes the response to rendering functions
- `bonus-configurator.html` in the root is a standalone single-file version (no server dependency)

### Regulatory strings

Values prefixed `v_` (e.g. `v_first_dep`, `v_slots_only`) and `reg_` are i18n keys resolved at render time — they are not raw strings in the config output.
