// Gulf (GCC) — currently the UAE only; Saudi Arabia / Kuwait / Qatar slot in here later.
//
// Regulatory position (why this is a separate region and not part of MENA):
// gambling is prohibited under UAE federal law, BUT since 2023 the General Commercial
// Gaming Regulatory Authority (GCGRA) licenses a narrow, explicitly LAND-BASED scope —
// integrated resorts (Wynn Al Marjan Island, Ras Al Khaimah) and the national lottery.
// Online casino is NOT within that scope and remains unlicensed, so online operators
// still serve the market offshore. Advertising is prohibited. The hard warning is
// surfaced in the UI via regulatoryNote('none', …, 'gcc') → reg_warn_gcc.
//
// Economically this is a completely different market from MENA — high disposable income,
// expat-heavy, ~4× the ARPU — which matters because arpu/cac/bpct are read at REGION
// level in buildConfig (a license block cannot override them). Folding the UAE into MENA
// would have understated it and overstated Syria.
//
// Currency: backend computes in USD (consistent with LATAM/MENA and forward-compatible
// with adding SAR/KWD/QAR); AED is a display-layer currency — see public/geo-data.js.
// AED is pegged at 3.6725/USD, so the display factor is stable.
//
// Calibration caveat: arpu/cac/avgdep are a market-picture estimate, not verified
// operator data — same caveat as src/config/games/catalog.json.
export const GCC = {
  arpu: 55, bpct: 0.25, cac: 12,
  // Live-heavy relative to every other region: Gulf/expat audiences skew hard to live
  // tables, which raises index-1 (99% RTP bucket) and lowers pure slot share.
  mix:  [0.65, 0.25, 0.10, 0.00] as [number, number, number, number],
  wcrs: [1.0, 0.0, 0.5, 0.5]    as [number, number, number, number],

  welcome:  { pct: 100, maxBMulti: 8, maxBMin: 500, maxBMax: 1000, minDRatio: 0.25, minDMin: 25, fs: 100, days: 30, code: 'WELCOME100', cur: 'USD' },
  ndb:      { type: 'combined' as string, amt: 10, ndCur: 'USD', wager: 40, maxW_x: 5, fs: 20, days: 7, limit: 'v_1_per_account', trigger: 'v_reg_verify' },
  // Friday, not Wednesday: the Gulf weekend is Fri–Sat, so the reload lands on the
  // highest-traffic day rather than mid-week.
  reload:   { maxBMulti: 2.5, maxBMin: 0, maxBMax: 200, day: 'v_day_fri', fs: 20, cur: 'USD' },
  wager:    { model: 'standard' as string, wW: 35, wN: 40, wR: 30, wF: 25, mb: 'v_no_limit', days: 30, basis: 'v_bonus_only', games: 'v_slots_only' },
  cashback: { model: 'flat' as string, pct: 12, cur: 'USD', period: 'v_weekly', basis: 'v_net_losses', wager: 0, minLossRatio: 0.30, maxAmtRatio: 20 },
  dep2:     { pct: 75, maxBMulti: 5, maxBMin: 300, maxBMax: 700, fs: 50, cur: 'USD' },
  dep3:     { pct: 50, maxBMulti: 3, maxBMin: 200, maxBMax: 500, fs: 30, cur: 'USD', wagerOffset: -5 },
  contrib:  [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 50 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec:   { count: 100, val: 0.20, cur: 'USD', days: 7 },
  reg:      ['reg_gcc_1', 'reg_gcc_2', 'reg_gcc_3'] as string[] | null,
};
