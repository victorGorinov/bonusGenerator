import { asyncHandler }          from '../middleware/asyncHandler.js';
import { ValidationError }        from '../errors/ValidationError.js';
import { generateBonusConfig, recalcBonusConfig } from '../use-cases/GenerateBonusConfig.js';
import type { GenerateInput }     from '../validation/generate.schema.js';
import type { RecalcInput }       from '../validation/recalc.schema.js';

export function createGenerateController() {
  return {
    generate: asyncHandler<Record<string, never>, unknown, GenerateInput>(
      async (req, res) => {
        res.json({ cfg: generateBonusConfig(req.body) });
      },
    ),

    recalc: asyncHandler<Record<string, never>, unknown, RecalcInput>(
      async (req, res) => {
        const { cfg, overrides } = req.body;
        if (!cfg) throw new ValidationError('cfg required');
        res.json(recalcBonusConfig(cfg, overrides));
      },
    ),
  };
}
