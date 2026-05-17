export const CRYPTO = {
  arpu: 95, bpct: 0.28, cac: 40,
  mix:  [0.50, 0.20, 0.25, 0.05] as [number, number, number, number],
  wcrs: [1.0, 0.1, 0.5, 0.5]    as [number, number, number, number],

  welcome: {
    pct: 150, maxBMulti: 15, maxBMin: 1000, maxBMax: 5000,
    minDRatio: 0.05, minDMin: 10, fs: 200, days: 90, code: 'WELCOME150',
  },
  ndb: { type: 'crypto' as string, amt: null as number | null, ndCur: null as string | null, wager: 50, maxW_x: 3, fs: 50, days: 14 },
  reload: { maxBMulti: 1.5, maxBMin: 0, maxBMax: 300, day: 'v_day_mon', fs: 100 },
  wager: { wW: 40, wN: 50, wR: 35, wF: 30, mb: 'v_no_limit', days: 90, basis: 'v_dep_bonus', games: 'v_all_games' },
  cashback: { model: 'flat' as string, pct: 15, period: 'v_weekly', basis: 'v_net_losses', wager: 0, minLossRatio: 0.30, maxAmtRatio: 50 },
  dep2: { pct: 100, maxBMulti: 3, maxBMin: 0, maxBMax: Infinity, fs: 150, days: 60 },
  dep3: { pct: 75,  maxBMulti: 2, maxBMin: 0, maxBMax: Infinity, fs: 100, wagerOffset: 0, days: 60 },
  contrib: [
    { game: 'Slots', pct: 100 }, { game: 'Live Casino', pct: 10 }, { game: 'Roulette', pct: 10 },
    { game: 'Blackjack', pct: 5 }, { game: 'Video Poker', pct: 20 }, { game: 'Crash Games', pct: 50 }, { game: 'Keno/Lottery', pct: 50 },
  ],
  fsSpec: { count: 200, val: 0.20, cur: 'USDT', days: 14 },
  reg: null as string[] | null,
};
