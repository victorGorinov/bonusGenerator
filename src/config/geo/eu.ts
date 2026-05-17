export const EU = {
  arpu: 65, bpct: 0.18, cac: 25,
  mix:  [0.60, 0.30, 0.05, 0.05] as [number, number, number, number],
  wcrs: [1.0, 0.0, 0.0, 0.5]    as [number, number, number, number],

  welcome: {
    pct: 100, maxBMulti: 6, maxBMin: 1000, maxBMax: 5000,
    minDRatio: 0.15, minDMin: 10, fs: 200, days: 30, code: 'WELCOME100',
  },
  ndb: { type: 'combined' as string, amt: 10, ndCur: 'FS', wager: 45, maxW_x: 3, fs: 50, days: 7 },
  reload: { maxBMulti: 1.5, maxBMin: 100, maxBMax: 500, day: 'v_day_tue', fs: 50 },
  wager: { wW: 35, wN: 50, wR: 25, wF: 25, mb: 'v_eu_max_bet', days: 30, basis: 'v_bonus_only', games: 'v_slots_only' },
  cashback: {
    model: 'tier' as string, period: 'v_monthly', basis: 'v_net_losses_monthly', wager: 0,
    tiers: [
      { name: 'ct_bronze',   color: '#CD7F32', fromX: 0,    toX: 100  as number | null, pct: '5%' },
      { name: 'ct_silver',   color: '#94A3B8', fromX: 100,  toX: 500  as number | null, pct: '10%' },
      { name: 'ct_gold',     color: '#D97706', fromX: 500,  toX: 2000 as number | null, pct: '15%' },
      { name: 'ct_platinum', color: '#7C3AED', fromX: 2000, toX: null as number | null, pct: '20%' },
    ],
  },
  dep2: { pct: 75, maxBMulti: 8, maxBMin: 1000, maxBMax: 2000, fs: 75 },
  dep3: { pct: 50, maxBMulti: 5, maxBMin: 500,  maxBMax: 1000, fs: 50, wagerOffset: -5 },
  contrib: [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 0 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec: { count: 200, val: 0.10, cur: 'EUR', days: 7 },
  reg: ['reg_mga_1', 'reg_mga_2', 'reg_mga_3', 'reg_mga_4', 'reg_mga_5'] as string[] | null,

  licenses: {
    ukgc: {
      welcome: { maxBMin: 100, maxBMax: 200 },
      ndb:     { type: 'fs_restricted' as string, amt: 0, ndCur: 'FS', wager: 10, maxW_x: 3, fs: 20, days: 7, note: 'ukgc_note' },
      reload:  { maxBMax: 100, fs: 0 },
      wager:   { wW: 10, wN: 10, wF: 10, mb: 'v_ukgc_max_bet' },
      dep2:    { maxBMulti: 2, maxBMin: 0, maxBMax: 100, fs: 0 },
      dep3:    { maxBMulti: 1.5, maxBMin: 0, maxBMax: 75, fs: 0 },
      reg:     ['reg_ukgc_1', 'reg_ukgc_2', 'reg_ukgc_3', 'reg_ukgc_4', 'reg_ukgc_5', 'reg_ukgc_6'] as string[],
    },
  } as Record<string, Record<string, unknown>>,
};
