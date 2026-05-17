export const MN = {
  arpu: 12, bpct: 0.22, cac: 5,
  mix:  [0.80, 0.15, 0.05, 0.00] as [number, number, number, number],
  wcrs: [1.0, 0.0, 0.5, 0.5]    as [number, number, number, number],

  welcome:  { type: 'match' as string, pct: 100, maxB: 100000, minD: 3000, cur: 'MNT', fs: 30, days: 30, code: 'WELCOME100', trigger: 'v_first_dep' },
  ndb:      { type: 'combined' as string, amtRatio: 0.25, amtMax: 5000, ndCur: 'MNT', wager: 35, maxW_x: 3, fs: 20, days: 7, limit: 'v_1_per_account', trigger: 'v_reg_verify' },
  reload:   { type: 'match' as string, pct: 50, maxBRatio: 0.75, maxBMax: 10000, cur: 'MNT', fs: 10, freq: 'v_weekly', day: 'v_day_sat', limit: 'v_1_per_period', code: 'RELOAD50' },
  wager:    { model: 'standard' as string, wW: 40, wN: 35, wR: 30, wF: 25, mb: 'v_no_limit', days: 30, basis: 'v_bonus_only', games: 'v_slots_only' },
  cashback: { model: 'flat' as string, pct: 8, cur: 'MNT', period: 'v_weekly', basis: 'v_net_losses', minLoss: '3000 MNT', maxAmt: '200000 MNT', wager: 0 },
  dep2:     { type: 'match' as string, pct: 75, maxB: 30000, minDRef: true, cur: 'MNT', fs: 15, days: 30, wagerRef: true, code: 'DEP2', trigger: 'v_2nd_purchase' },
  dep3:     { type: 'match' as string, pct: 50, maxB: 20000, minDRef: true, cur: 'MNT', fs: 10, days: 30, wager: 35, code: 'DEP3', trigger: 'v_3rd_purchase' },
  contrib:  [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 50 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec:   { count: 50, val: 0.05, cur: 'EUR', days: 7 },
  reg:      null as string[] | null,
};
