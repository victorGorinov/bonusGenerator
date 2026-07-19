// ══════════════════════════════════════════════════════════════════════════
// GEO-DATA.JS — single source of truth for geo/country/currency data
// Loaded as a plain (non-module) script BEFORE the tool scripts; exposes globals
// on window so configurator.js / loyalty-generator.js / tournament-generator.js
// all read the same list instead of maintaining ~6 duplicated dicts.
//
// Currency model (display layer — backend is never re-scaled):
//   • `cur`   — the currency the BACKEND computes in (sent as sitecur/depcur).
//               EU→EUR, CIS→RUB, MN→MNT, LatAm→USD (single shared USD object).
//   • `rate`  — units of `cur` per 1 USD (to convert backend output ↔ USD).
//   • `local` — the region's real display currency. Equals `cur` for non-LatAm;
//               the country's own currency (BRL/MXN/…) for LatAm.
//   • `localRate` — units of `local` per 1 USD.
//   • `avgdep` — default average deposit, expressed in `cur` (backend currency).
//
// A currency toggle picks a display currency (region-local by default, or USD).
// Conversion of a backend amount to the display currency is a single factor:
//   factor = targetRate / rate   (targetRate = localRate for 'local', 1 for 'usd')
// See curFactor() / convertConfigCurrency() below.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  // units of currency per 1 USD (approx, Jan 2026). Update when rates shift.
  const RATES = {
    USD: 1, USDT: 1, SC: 1,
    EUR: 0.92, GBP: 0.79, DKK: 6.9,
    RUB: 90, KZT: 480, MNT: 3450,
    BRL: 5.5, MXN: 18.5, COP: 4100, ARS: 1050, PEN: 3.75, CLP: 950,
  };

  // val, flag, en, ru, region, lic, cur (backend), local (display), lang, avgdep (in `cur`)
  const RAW = [
    { val:'de', flag:'🇩🇪', en:'Germany',     ru:'Германия',    region:'eu',    lic:'mga',       cur:'EUR', local:'EUR', lang:'de', avgdep:50 },
    { val:'fr', flag:'🇫🇷', en:'France',      ru:'Франция',     region:'eu',    lic:'mga',       cur:'EUR', local:'EUR', lang:'en', avgdep:45 },
    { val:'es', flag:'🇪🇸', en:'Spain',       ru:'Испания',     region:'eu',    lic:'mga',       cur:'EUR', local:'EUR', lang:'es', avgdep:40 },
    { val:'it', flag:'🇮🇹', en:'Italy',       ru:'Италия',      region:'eu',    lic:'mga',       cur:'EUR', local:'EUR', lang:'en', avgdep:40 },
    { val:'nl', flag:'🇳🇱', en:'Netherlands', ru:'Нидерланды',  region:'eu',    lic:'mga',       cur:'EUR', local:'EUR', lang:'en', avgdep:55 },
    { val:'dk', flag:'🇩🇰', en:'Denmark',     ru:'Дания',       region:'eu',    lic:'dga',       cur:'DKK', local:'DKK', lang:'da', avgdep:700 },
    { val:'uk', flag:'🇬🇧', en:'UK',          ru:'Великобритания', region:'eu', lic:'ukgc',      cur:'GBP', local:'GBP', lang:'en', avgdep:45 },
    { val:'ru', flag:'🇷🇺', en:'Russia',      ru:'Россия',      region:'cis',   lic:'none',      cur:'RUB', local:'RUB', lang:'ru', avgdep:3000 },
    { val:'kz', flag:'🇰🇿', en:'Kazakhstan',  ru:'Казахстан',   region:'cis',   lic:'none',      cur:'KZT', local:'KZT', lang:'ru', avgdep:15000 },
    { val:'mn', flag:'🇲🇳', en:'Mongolia',    ru:'Монголия',    region:'mn',    lic:'none',      cur:'MNT', local:'MNT', lang:'mn', avgdep:80000 },
    { val:'us', flag:'🇺🇸', en:'USA Sweep',   ru:'США Sweep',   region:'sweep', lic:'none',      cur:'USD', local:'USD', lang:'en', avgdep:30 },
    // LatAm — backend computes in USD; `local` drives display + currency toggle.
    { val:'br', flag:'🇧🇷', en:'Brazil',      ru:'Бразилия',    region:'latam', lic:'bets_br',   cur:'USD', local:'BRL', lang:'es', avgdep:30 },
    { val:'mx', flag:'🇲🇽', en:'Mexico',      ru:'Мексика',     region:'latam', lic:'segob',     cur:'USD', local:'MXN', lang:'es', avgdep:35 },
    { val:'co', flag:'🇨🇴', en:'Colombia',    ru:'Колумбия',    region:'latam', lic:'coljuegos', cur:'USD', local:'COP', lang:'es', avgdep:30 },
    { val:'ar', flag:'🇦🇷', en:'Argentina',   ru:'Аргентина',   region:'latam', lic:'none',      cur:'USD', local:'ARS', lang:'es', avgdep:30 },
    { val:'pe', flag:'🇵🇪', en:'Peru',        ru:'Перу',        region:'latam', lic:'mincetur',  cur:'USD', local:'PEN', lang:'es', avgdep:30 },
    { val:'cl', flag:'🇨🇱', en:'Chile',       ru:'Чили',        region:'latam', lic:'none',      cur:'USD', local:'CLP', lang:'es', avgdep:30 },
  ];

  const REGION_LABELS = {
    eu:    { en:'Europe (EU/UK)', ru:'Европа (EU/UK)' },
    cis:   { en:'CIS',            ru:'СНГ' },
    mn:    { en:'Mongolia',       ru:'Монголия' },
    latam: { en:'LatAm',          ru:'Латам' },
    sweep: { en:'USA Sweepstakes',ru:'США Sweepstakes' },
  };

  const GEO_DATA = RAW.map(g => ({
    ...g,
    rate:      RATES[g.cur]   ?? 1,
    localRate: RATES[g.local] ?? RATES[g.cur] ?? 1,
    lbl:       `${g.flag} ${g.en}`,
  }));

  function geoOf(val) { return GEO_DATA.find(g => g.val === val) || GEO_DATA[0]; }

  // Grouped by region for <optgroup> selectors (order follows RAW order).
  function geoGroups(lang) {
    const L = lang === 'ru' ? 'ru' : 'en';
    const order = [];
    const map = {};
    for (const g of GEO_DATA) {
      if (!map[g.region]) { map[g.region] = []; order.push(g.region); }
      map[g.region].push(g);
    }
    return order.map(r => ({
      region: r,
      label:  (REGION_LABELS[r] || { en:r, ru:r })[L],
      items:  map[r],
    }));
  }

  // ── Currency toggle helpers ────────────────────────────────────────────────
  // mode: 'local' (region currency, default) | 'usd'
  function dispCur(geo, mode) { return mode === 'usd' ? 'USD' : geo.local; }
  function dispRate(geo, mode) { return mode === 'usd' ? 1 : geo.localRate; }

  // Factor to multiply a backend amount (in geo.cur) to get the display currency.
  function curFactor(geo, mode) { return dispRate(geo, mode) / geo.rate; }

  // Convert an avgdep the user typed in the DISPLAY currency back to geo.cur
  // (the value the backend expects as sitecur amount).
  function avgdepToBase(dispValue, geo, mode) {
    return dispValue / curFactor(geo, mode);
  }
  // Convert the geo's default avgdep (in geo.cur) to the display currency.
  function avgdepToDisp(geo, mode) {
    return geo.avgdep * curFactor(geo, mode);
  }

  // ── Config currency conversion (display layer) ─────────────────────────────
  // Multiplies the sitecur-denominated monetary fields of a /api/generate cfg by
  // `factor` and relabels currency codes to `toCur`. USD econ benchmarks
  // (arpu/cac/ltv3/mBudget/totLTV) and ratios/percentages are left untouched.
  // Pure: returns a new object, does not mutate the input.
  function convertConfigCurrency(cfg, factor, toCur) {
    if (!cfg || factor === 1) return cfg;
    const c = JSON.parse(JSON.stringify(cfg));
    const num = (v) => (typeof v === 'number' ? Math.round(v * factor) : v);
    // "123 USD" | "∞" → "677 BRL"
    const money = (s) => {
      if (typeof s !== 'string') return s;
      const m = s.match(/^([\d.,]+)\s*([A-Za-z]+)?$/);
      if (!m) return s; // e.g. '∞'
      return `${Math.round(parseFloat(m[1].replace(/,/g, '')) * factor).toLocaleString('en')} ${toCur}`;
    };
    const relabel = (o) => { if (o && typeof o === 'object' && typeof o.cur === 'string') o.cur = toCur; };

    if (typeof c.dep === 'number') c.dep = num(c.dep);
    if (typeof c.cur === 'string') c.cur = toCur;

    for (const k of ['welcome', 'reload', 'dep2', 'dep3']) {
      const m = c[k]; if (!m || typeof m !== 'object') continue;
      m.maxB = num(m.maxB); m.minD = num(m.minD); relabel(m);
    }
    if (c.ndb && typeof c.ndb === 'object') {
      // amt is a currency amount only when ndCur is a real currency (not FS).
      if (c.ndb.ndCur && c.ndb.ndCur !== 'FS') { c.ndb.amt = num(c.ndb.amt); c.ndb.ndCur = toCur; }
    }
    if (c.cashback && typeof c.cashback === 'object') {
      c.cashback.minLoss = money(c.cashback.minLoss);
      c.cashback.maxAmt  = money(c.cashback.maxAmt);
      relabel(c.cashback);
      if (Array.isArray(c.cashback.tiers)) c.cashback.tiers.forEach(t => { t.from = money(t.from); t.to = money(t.to); });
    }
    if (c.fsSpec && typeof c.fsSpec === 'object') { c.fsSpec.val = typeof c.fsSpec.val === 'number' ? c.fsSpec.val * factor : c.fsSpec.val; relabel(c.fsSpec); }

    const e = c.econ;
    if (e && typeof e === 'object') {
      for (const k of ['bonusSize', 'maxRisk', 'stressTest']) if (typeof e[k] === 'number') e[k] = num(e[k]);
      for (const s of ['sP10', 'sP50', 'sP90']) {
        const sc = e[s]; if (!sc) continue;
        if (typeof sc.cost === 'number') sc.cost = num(sc.cost);
        if (typeof sc.payout === 'number') sc.payout = +(sc.payout * factor).toFixed(2);
        if (typeof sc.turnover === 'number') sc.turnover = num(sc.turnover);
      }
      if (e.chain && typeof e.chain === 'object') {
        if (typeof e.chain.chainCost === 'number') e.chain.chainCost = num(e.chain.chainCost);
        if (typeof e.chain.chainMaxRisk === 'number') e.chain.chainMaxRisk = num(e.chain.chainMaxRisk);
        if (Array.isArray(e.chain.steps)) e.chain.steps.forEach(st => {
          if (typeof st.bonusSize === 'number') st.bonusSize = +(st.bonusSize * factor).toFixed(2);
          if (typeof st.cost === 'number') st.cost = num(st.cost);
        });
      }
      // arpu / cac / ltv3 / mBudget / totLTV stay in USD; costRatio/roi3/be are ratios.
    }
    return c;
  }

  // Scale the listed numeric (money) keys of a flat econ object by `factor`,
  // leaving counts/ratios/percentages untouched. Returns a shallow clone (pure).
  // The single place tournament/loyalty econ money-fields are converted, so a
  // field is either in the list (money) or it isn't — no scattered `* factor`.
  function scaleFields(obj, factor, keys) {
    if (!obj || factor === 1) return obj;
    const o = { ...obj };
    for (const k of keys) if (typeof o[k] === 'number') o[k] = o[k] * factor;
    return o;
  }

  // Convert a /api/recalc { costs, maxRisk } payload (all sitecur) by `factor`.
  function convertCosts(data, factor) {
    if (!data || factor === 1) return data;
    const d = JSON.parse(JSON.stringify(data));
    if (d.costs && typeof d.costs === 'object') {
      for (const k of Object.keys(d.costs)) if (typeof d.costs[k] === 'number') d.costs[k] = Math.round(d.costs[k] * factor);
    }
    if (typeof d.maxRisk === 'number') d.maxRisk = Math.round(d.maxRisk * factor);
    return d;
  }

  window.GEO_DATA = GEO_DATA;
  window.GeoData = {
    all: GEO_DATA,
    of: geoOf,
    groups: geoGroups,
    rates: RATES,
    regionLabels: REGION_LABELS,
    dispCur, dispRate, curFactor, avgdepToBase, avgdepToDisp,
    convertConfigCurrency, convertCosts, scaleFields,
  };
})();
