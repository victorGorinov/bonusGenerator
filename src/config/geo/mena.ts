// MENA (grey) — Iraq, Libya, Syria.
//
// All three prohibit gambling outright (Iraq: Penal Code 111/1969; Libya: Sharia-based
// prohibition, no gaming authority; Syria: prohibited, the state casino has been closed
// since 1976). There is no local licensing path — operators serve these markets from
// offshore (Curaçao / Anjouan) with no in-country registration, and players arrive via
// VPN/mirrors. Payment rails are crypto + local e-wallets (ZainCash, FastPay,
// AsiaHawala in Iraq) rather than cards.
//
// Currency model mirrors LATAM: the BACKEND computes everything in USD because a single
// shared geo object cannot hold three currency scales (IQD ×1310 … SYP ×13000), and the
// SYP scale would also push truncNormalPayout into its underflow range. Local currency
// (IQD/LYD/SYP) is a DISPLAY layer only — see public/geo-data.js.
//
// Economic calibration (arpu/cac/bpct/avgdep) is a market-picture estimate, NOT verified
// operator data — same caveat as src/config/games/catalog.json. Low ARPU, cheap traffic,
// but elevated multi-account / bonus-abuse exposure, which is why wagers sit above the
// LATAM offshore base and NDB is deliberately small.
export const MENA = {
  arpu: 14, bpct: 0.32, cac: 5,
  mix:  [0.80, 0.10, 0.10, 0.00] as [number, number, number, number],
  wcrs: [1.0, 0.0, 0.5, 0.5]    as [number, number, number, number],

  welcome:  { pct: 100, maxBMulti: 8, maxBMin: 200, maxBMax: 400, minDRatio: 0.25, minDMin: 5, fs: 100, days: 30, code: 'WELCOME100', cur: 'USD' },
  // Small NDB on purpose: no KYC infrastructure + high multi-account risk make a
  // generous no-deposit offer the cheapest thing in the product to farm.
  ndb:      { type: 'combined' as string, amt: 3, ndCur: 'USD', wager: 50, maxW_x: 5, fs: 10, days: 7, limit: 'v_1_per_account', trigger: 'v_reg_verify' },
  reload:   { maxBMulti: 2.5, maxBMin: 0, maxBMax: 60, day: 'v_day_wed', fs: 20, cur: 'USD' },
  wager:    { model: 'standard' as string, wW: 45, wN: 50, wR: 40, wF: 35, mb: 'v_no_limit', days: 30, basis: 'v_bonus_only', games: 'v_slots_only' },
  cashback: { model: 'flat' as string, pct: 10, cur: 'USD', period: 'v_weekly', basis: 'v_net_losses', wager: 0, minLossRatio: 0.33, maxAmtRatio: 15 },
  dep2:     { pct: 75, maxBMulti: 5, maxBMin: 100, maxBMax: 250, fs: 50, cur: 'USD' },
  dep3:     { pct: 50, maxBMulti: 3, maxBMin: 75,  maxBMax: 150, fs: 30, cur: 'USD', wagerOffset: -5 },
  contrib:  [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 50 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec:   { count: 100, val: 0.08, cur: 'USD', days: 7 },
  reg:      ['reg_mena_1', 'reg_mena_2', 'reg_mena_3'] as string[] | null,
};
