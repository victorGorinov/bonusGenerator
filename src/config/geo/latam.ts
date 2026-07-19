export const LATAM = {
  arpu: 18, bpct: 0.30, cac: 7,
  mix:  [0.75, 0.15, 0.10, 0.00] as [number, number, number, number],
  wcrs: [1.0, 0.0, 0.5, 0.5]    as [number, number, number, number],

  welcome:  { pct: 100, maxBMulti: 8, maxBMin: 300, maxBMax: 500, minDRatio: 0.25, minDMin: 10, fs: 100, days: 30, code: 'WELCOME100', cur: 'USD' },
  ndb:      { type: 'combined' as string, amt: 5, ndCur: 'USD', wager: 45, maxW_x: 5, fs: 15, days: 7, limit: 'v_1_per_account', trigger: 'v_reg_verify' },
  reload:   { maxBMulti: 2.5, maxBMin: 0, maxBMax: 75, day: 'v_day_wed', fs: 20, cur: 'USD' },
  wager:    { model: 'standard' as string, wW: 40, wN: 45, wR: 35, wF: 30, mb: 'v_no_limit', days: 30, basis: 'v_bonus_only', games: 'v_slots_only' },
  cashback: { model: 'flat' as string, pct: 10, cur: 'USD', period: 'v_weekly', basis: 'v_net_losses', wager: 0, minLossRatio: 0.33, maxAmtRatio: 17 },
  dep2:     { pct: 75, maxBMulti: 5, maxBMin: 150, maxBMax: 300, fs: 50, cur: 'USD' },
  dep3:     { pct: 50, maxBMulti: 3, maxBMin: 100, maxBMax: 200, fs: 30, cur: 'USD', wagerOffset: -5 },
  contrib:  [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 50 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec:   { count: 100, val: 0.10, cur: 'USD', days: 7 },
  reg:      null as string[] | null,

  // Per-country license overrides (like EU's ukgc/dga blocks). The base LATAM
  // object is the offshore Curaçao default used by Argentina (provincial, no
  // unified regime) and Chile (bill pending, grey market). Regulated markets —
  // Brazil (federal "Bets"/SPA), Mexico (SEGOB), Colombia (Coljuegos), Peru
  // (MINCETUR) — get their own block. All amounts are USD (backend computes LATAM
  // in USD; local-currency display is a frontend layer, see geo-data.js).
  licenses: {
    // Brazil — federal "Bets" regime (Law 14.790/2023, SPA/Ministry of Finance),
    // regulated market live since 2025-01-01. KYC via CPF + facial recognition;
    // SPA restricts player bonuses/advance credit; 12% GGR tax.
    bets_br: {
      welcome: { maxBMin: 200, maxBMax: 400 },
      wager:   { wW: 35 },
      reg:     ['reg_betsbr_1', 'reg_betsbr_2', 'reg_betsbr_3'] as string[],
    },
    // Mexico — SEGOB permits (Ley Federal de Juegos y Sorteos). Relatively
    // permissive; KYC + published T&Cs + responsible-gaming tools required.
    // Welcome wager 35x market average (verified 2026-07-19) — override the
    // offshore base wW:40, which is above MX practice.
    segob: {
      welcome: { maxBMin: 250, maxBMax: 500 },
      wager:   { wW: 35 },
      reg:     ['reg_segob_1', 'reg_segob_2'] as string[],
    },
    // Colombia — Coljuegos (Ley 1753/2015), first fully regulated online market
    // in LatAm (2016). 2025 temporary 19% VAT on deposits; KYC/AML mandatory.
    coljuegos: {
      welcome: { maxBMin: 200, maxBMax: 450 },
      wager:   { wW: 35 },
      reg:     ['reg_coljuegos_1', 'reg_coljuegos_2'] as string[],
    },
    // Peru — MINCETUR (Ley 31557), regulated since 2024. 0.3% ISI consumption
    // tax on deposits; KYC + responsible-gaming measures mandatory.
    // Welcome wager 35x market average (verified 2026-07-19; players value 20–35x)
    // — override the offshore base wW:40.
    mincetur: {
      welcome: { maxBMax: 450 },
      wager:   { wW: 35 },
      reg:     ['reg_mincetur_1', 'reg_mincetur_2'] as string[],
    },
  } as Record<string, Record<string, unknown>>,
};
