import { asyncHandler }             from '../middleware/asyncHandler.js';
import * as bonusService             from '../services/bonus.service.js';
import { ValidationError }           from '../errors/ValidationError.js';
import type { GenerateInput }        from '../validation/generate.schema.js';
import type { RecalcInput }          from '../validation/recalc.schema.js';

export const generate = asyncHandler<Record<string, never>, unknown, GenerateInput>(
  async (req, res) => {
    const cfg = bonusService.generate(req.body);
    res.json({ cfg });
  },
);

export const recalc = asyncHandler<Record<string, never>, unknown, RecalcInput>(
  async (req, res) => {
    const { cfg, overrides } = req.body;
    if (!cfg) throw new ValidationError('cfg required');
    res.json(bonusService.recalc(cfg, overrides ?? {}));
  },
);
