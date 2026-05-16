import * as bonusService   from '../services/bonus.service.js';
import { ValidationError } from '../errors/ValidationError.js';

export function generate(req, res, next) {
  try {
    const cfg = bonusService.generate(req.body || {});
    res.json({ cfg });
  } catch (err) {
    next(err);
  }
}

export function recalc(req, res, next) {
  const { cfg, overrides } = req.body || {};
  if (!cfg) return next(new ValidationError('cfg required'));
  try {
    res.json(bonusService.recalc(cfg, overrides));
  } catch (err) {
    next(err);
  }
}
