import { buildConfig }   from '../domain/bonus/buildConfig.js';
import { recalcCosts }  from '../domain/bonus/recalcCosts.js';

export function generate(params) {
  return buildConfig(params);
}

export function recalc(cfg, overrides) {
  return recalcCosts(cfg, overrides);
}
