import { buildLoyaltyConfig }    from '../domain/loyalty/buildConfig.js';
import { calcLoyaltyEconomics }  from '../domain/loyalty/calcEconomics.js';
import type { LoyaltyBuildParams } from '../domain/loyalty/types.js';

export function generate(params: LoyaltyBuildParams) {
  const config = buildLoyaltyConfig(params);
  const econ   = calcLoyaltyEconomics(config);
  return { config, econ };
}
