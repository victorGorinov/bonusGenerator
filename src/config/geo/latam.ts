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
};
