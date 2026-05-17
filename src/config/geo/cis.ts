export const CIS = {
  arpu: 22, bpct: 0.25, cac: 8,
  mix:  [0.85, 0.10, 0.05, 0.00] as [number, number, number, number],
  wcrs: [1.0, 0.0, 0.5, 0.5]    as [number, number, number, number],

  welcome: {
    pct: 100, maxBMulti: 5, maxBMin: 0, maxBMax: Infinity,
    minDRatio: 0.30, minDMin: 0, fs: 100, days: 30, code: 'WELCOME100',
  },
  ndb: { type: 'combined' as string, amt: 30, ndCur: 'FS', wager: 55, maxW_x: 5, fs: 50, days: 7 },
  reload: { maxBMulti: 1.5, maxBMin: 0, maxBMax: 200, day: 'v_day_fri', fs: 50 },
  wager: { wW: 40, wN: 55, wR: 35, wF: 35, mb: 'v_no_limit', days: 30, basis: 'v_bonus_only', games: 'v_slots_only' },
  cashback: { model: 'flat' as string, pct: 10, period: 'v_weekly', basis: 'v_net_losses', wager: 0, minLossRatio: 0.30, maxAmtRatio: 50 },
  dep2: { pct: 75, maxBMulti: 3, maxBMin: 0, maxBMax: Infinity, fs: 75 },
  dep3: { pct: 50, maxBMulti: 2, maxBMin: 0, maxBMax: Infinity, fs: 50, wagerOffset: -5 },
  contrib: [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 50 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec: { count: 200, val: 0.10, cur: 'EUR', days: 7 },
  reg: null as string[] | null,
};
