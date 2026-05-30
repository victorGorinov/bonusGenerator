import * as bonusService           from '../services/bonus.service.js';
import type { GenerateInput }      from '../validation/generate.schema.js';
import type { RecalcInput }        from '../validation/recalc.schema.js';

export function generateBonusConfig(input: GenerateInput): ReturnType<typeof bonusService.generate> {
  return bonusService.generate(input);
}

export function recalcBonusConfig(
  cfg: RecalcInput['cfg'],
  overrides: RecalcInput['overrides'],
): ReturnType<typeof bonusService.recalc> {
  return bonusService.recalc(cfg, overrides ?? {});
}
