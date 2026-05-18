// Global license overrides — applied regardless of geo when lic is set explicitly.
// Region-level license blocks (geo.licenses[lic]) always take priority over these.
// Permissive licenses only override reg strings and wager context; no bonus caps.
export const GLOBAL_LICENSE_OVERRIDES: Record<string, {
  reg?:   unknown[];
  wager?: Record<string, unknown>;
}> = {
  curacao: {
    reg:   ['reg_curacao_1', 'reg_curacao_2'],
    wager: { mb: 'v_standard_max_bet' },
  },
  anjouan: {
    reg:   ['reg_anjouan_1'],
    wager: { mb: 'v_standard_max_bet' },
  },
  kahnawake: {
    reg:   ['reg_kahnawake_1'],
  },
  gibraltar: {
    reg:   ['reg_gibraltar_1'],
    wager: { wW: 30, wN: 35 },
  },
  isle_of_man: {
    reg:   ['reg_iom_1'],
    wager: { wW: 30 },
  },
  none: {},
};
