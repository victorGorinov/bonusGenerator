import { buildConfig, type BuildConfigParams } from '../domain/bonus/buildConfig.js';
import { recalcCosts }                         from '../domain/bonus/recalcCosts.js';

export function generate(params: BuildConfigParams): Record<string, unknown> {
  return buildConfig(params);
}

export function recalc(cfg: Record<string, unknown>, overrides: Record<string, unknown>): ReturnType<typeof recalcCosts> {
  return recalcCosts(cfg, overrides);
}
