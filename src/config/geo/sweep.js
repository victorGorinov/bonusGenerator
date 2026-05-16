export const SWEEP = {
  arpu: 14, bpct: 0.45, cac: 4,
  mix:  [0.80, 0.15, 0.05, 0.00],
  wcrs: [1.0, 0.0, 0.5, 0.5],

  welcome:  { type: 'sweep', sc: 10, gc: 1000, trigger: 'v_sweep_trigger', validity: 30, wager: 0, cur: 'USD', code: 'SWEEP10' },
  ndb:      { type: 'daily', sc: 1, gc: 100, trigger: 'v_daily_trigger', days: 1, limit: 'v_1_per_period', wager: 0 },
  reload:   { type: 'packages', pkgs: [{ price: '$4.99', sc: 100 }, { price: '$9.99', sc: 250 }, { price: '$19.99', sc: 500 }, { price: '$49.99', sc: 1500 }] },
  wager:    { model: 'none', wW: 0, wN: 0, wR: 0, wF: 0, mb: 'v_no_limit', days: 0, basis: 'v_no_wager', games: 'v_no_limit' },
  cashback: { model: 'flat', pct: 5, cur: 'SC', period: 'v_weekly', basis: 'v_net_losses', minLoss: '10 SC', maxAmt: '500 SC', wager: 0 },
  dep2:     { type: 'sc_purchase', pct: 25, trigger: 'v_2nd_purchase', note: 'v_sc_purchase_bonus' },
  dep3:     { type: 'sc_purchase', pct: 50, trigger: 'v_3rd_purchase', note: 'v_sc_purchase_bonus' },
  contrib:  [
    { game: 'Slots', pct: 100 }, { game: 'Slots low RTP', pct: 0 }, { game: 'Live Casino', pct: 0 },
    { game: 'Roulette', pct: 0 }, { game: 'Blackjack', pct: 0 }, { game: 'Crash Games', pct: 50 }, { game: 'Scratch Cards', pct: 50 },
  ],
  fsSpec:   null,
  reg:      ['reg_sweep_1', 'reg_sweep_2', 'reg_sweep_3', 'reg_sweep_4', 'reg_sweep_5'],
};
