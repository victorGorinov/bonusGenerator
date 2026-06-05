import { truncNormalPayout } from './payout.js';
import { CHAIN_PROGRESSION } from './chainModel.js';

type BonusCfg = Record<string, unknown>;

export function recalcCosts(cfg: BonusCfg, overrides: Record<string, unknown>): {
  costs: { w_p10: number; w_p50: number; w_p90: number; ndb: number; rl: number; d2: number; d3: number; fs: number; total: number };
  ratio: number;
  maxRisk: number;
} {
  const econ    = cfg['econ']    as Record<string, number>;
  const dep     = cfg['dep']     as number;
  const pl      = cfg['pl']      as number;
  const ndb     = cfg['ndb']     as Record<string, unknown>;
  const fsSpec  = cfg['fsSpec']  as Record<string, number> | null;
  const wager   = cfg['wager']   as Record<string, unknown>;
  const reload  = cfg['reload']  as Record<string, unknown>;
  const dep2    = cfg['dep2']    as Record<string, unknown>;
  const dep3    = cfg['dep3']    as Record<string, unknown>;
  const welcome = cfg['welcome'] as Record<string, unknown>;
  const ov      = overrides || {};

  const gv = (key: string, def: number): number => {
    if (!(key in ov)) return def;
    const v = parseFloat(String(ov[key]));
    return (isNaN(v) || v < 0) ? def : v;
  };
  const spinV = fsSpec ? fsSpec['val'] : 0.10;

  function svCost(bonusSize: number, wagerX: number, conv: number, dWCR: number, dRTP: number): number {
    if (bonusSize <= 0 || wagerX <= 0) return 0;
    const adjWCR = Math.max(0.01, econ['mixedWCR'] + (dWCR || 0));
    const adjRTP = Math.min(0.999, Math.max(0.5, econ['mixedRTP'] + (dRTP || 0)));
    return Math.round(truncNormalPayout(bonusSize, wagerX, adjWCR, adjRTP) * conv * pl);
  }

  const w_pct   = gv('w_pct',   (welcome['pct']  as number) || 100);
  const w_wager = gv('w_wager', econ['wagerX']);
  const w_maxB  = gv('w_maxB',  welcome['maxB'] as number);
  const w_fs    = gv('w_fs',    (welcome['fs']   as number) || 0);
  const w_bonus = Math.min(dep * w_pct / 100, w_maxB) + w_fs * spinV;
  const c_w_p10 = svCost(w_bonus, w_wager, 0.10, -0.02, -0.005);
  const c_w_p50 = svCost(w_bonus, w_wager, 0.20,  0,     0);
  const c_w_p90 = svCost(w_bonus, w_wager, 0.40, +0.02, +0.003);

  const ndb_wager = gv('ndb_wager', (ndb['wager'] as number) || 50);
  let ndb_size = 0;
  const ndbType = ndb['type'] as string;
  if      (ndbType === 'fs_restricted') ndb_size = gv('ndb_fs',  (ndb['fs']  as number) || 10) * spinV;
  else if (ndbType === 'crypto')        ndb_size = gv('ndb_amt', (ndb['amt'] as number) || 0);
  else if (ndbType === 'combined')      ndb_size = gv('ndb_amt', (ndb['amt'] as number) || 0) + gv('ndb_fs', (ndb['fs'] as number) || 0) * spinV;
  else if (ndb['amt'])                  ndb_size = ndbType === 'fs' ? gv('ndb_fs', (ndb['amt'] as number) || 0) * spinV : gv('ndb_amt', (ndb['amt'] as number) || 0);
  const c_ndb = svCost(ndb_size, ndb_wager, 0.20, 0, 0);

  const rl_pct   = gv('rl_pct',   (reload['pct']  as number) || 50);
  const rl_wager = gv('rl_wager', (wager['wR']    as number) || 35);
  const rl_maxB  = gv('rl_maxB',  (reload['maxB'] as number) || 0);
  const rl_fs    = gv('rl_fs',    (reload['fs']   as number) || 0);
  const rl_bonus = Math.min(dep * rl_pct / 100, rl_maxB) + rl_fs * spinV;
  const c_rl     = svCost(rl_bonus, rl_wager, 0.20, 0, 0);

  const d2_pct   = gv('d2_pct',   (dep2['pct']   as number) || 75);
  const d2_wager = gv('d2_wager', (dep2['wager'] as number) || econ['wagerX']);
  const d2_maxB  = gv('d2_maxB',  (dep2['maxB']  as number) || 0);
  const d2_fs    = gv('d2_fs',    (dep2['fs']    as number) || 0);
  const d2_bonus = Math.min(dep * d2_pct / 100, d2_maxB) + d2_fs * spinV;
  const c_d2     = svCost(d2_bonus, d2_wager, 0.20 * CHAIN_PROGRESSION.dep2, 0, 0);

  const d3_pct   = gv('d3_pct',   (dep3['pct']   as number) || 50);
  const d3_wager = gv('d3_wager', (dep3['wager'] as number) || econ['wagerX']);
  const d3_maxB  = gv('d3_maxB',  (dep3['maxB']  as number) || 0);
  const d3_fs    = gv('d3_fs',    (dep3['fs']    as number) || 0);
  const d3_bonus = Math.min(dep * d3_pct / 100, d3_maxB) + d3_fs * spinV;
  const c_d3     = svCost(d3_bonus, d3_wager, 0.20 * CHAIN_PROGRESSION.dep3, 0, 0);

  const fs_wager = gv('fs_wager', fsSpec ? fsSpec['wager'] : 30);
  const fs_count = gv('fs_count', fsSpec ? fsSpec['count'] : 0);
  const fs_bonus = fsSpec ? fs_count * fsSpec['val'] : 0;
  const c_fs     = svCost(fs_bonus, fs_wager, 0.20, 0, 0);

  const total = c_w_p50 + c_ndb + c_rl + c_d2 + c_d3 + c_fs;
  return {
    costs:   { w_p10: c_w_p10, w_p50: c_w_p50, w_p90: c_w_p90, ndb: c_ndb, rl: c_rl, d2: c_d2, d3: c_d3, fs: c_fs, total },
    ratio:   (pl * dep) > 0 ? c_w_p50 / (pl * dep) : 0,
    maxRisk: Math.round(pl * w_bonus),
  };
}
